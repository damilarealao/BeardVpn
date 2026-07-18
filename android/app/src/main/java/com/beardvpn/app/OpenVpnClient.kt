package com.beardvpn.app

import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.ByteBuffer
import java.security.KeyFactory
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.security.spec.PKCS8EncodedKeySpec
import java.util.Base64
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocket
import javax.net.ssl.SSLSocketFactory
import javax.net.ssl.TrustManagerFactory

class OpenVpnClient(
    private val vpnService: VpnService,
    private val config: OvpnConfig,
    private val tunFd: ParcelFileDescriptor,
    private val onConnected: () -> Unit,
    private val onDisconnected: () -> Unit,
    private val onError: (String) -> Unit
) {
    private val running = AtomicBoolean(false)
    private var sslSocket: SSLSocket? = null
    private var sslInput: java.io.InputStream? = null
    private var sslOutput: java.io.OutputStream? = null
    private var tunInput: FileInputStream? = null
    private var tunOutput: FileOutputStream? = null

    val bytesIn = AtomicLong(0)
    val bytesOut = AtomicLong(0)

    private var serverToTunThread: Thread? = null
    private var tunToServerThread: Thread? = null

    companion object {
        private const val TAG = "OpenVpnClient"
        private const val OPENVPN_MTU = 1500
        private const val P_DATA_V1 = 0x30
        private const val P_CONTROL_HARD_RESET_CLIENT_V2 = 0x38
        private const val P_ACK_V1 = 0x28
        private const val P_PUSH_REQUEST = 0x38
        private const val SOCKET_TIMEOUT_MS = 10000
    }

    fun start(): Boolean {
        if (running.getAndSet(true)) return true

        Thread({
            try {
                connectAndRun()
            } catch (e: Exception) {
                Log.e(TAG, "Connection failed", e)
                if (running.get()) {
                    onError(e.message ?: "Connection failed")
                    running.set(false)
                    onDisconnected()
                }
            }
        }, "OpenVPN-Main").start()

        return true
    }

    fun stop() {
        running.set(false)
        try { sslSocket?.close() } catch (_: Exception) {}
        try { tunFd?.close() } catch (_: Exception) {}
        serverToTunThread?.interrupt()
        tunToServerThread?.interrupt()
        onDisconnected()
    }

    private fun connectAndRun() {
        Log.i(TAG, "Connecting to ${config.serverHost}:${config.serverPort}")

        val socket = Socket()
        socket.soTimeout = SOCKET_TIMEOUT_MS
        val addr = InetSocketAddress(config.serverHost, config.serverPort)

        vpnService.protect(socket)
        socket.connect(addr, SOCKET_TIMEOUT_MS)

        val sslContext = createSSLContext()
        val factory = sslContext.socketFactory
        val ssl = factory.createSocket(
            socket,
            config.serverHost,
            config.serverPort,
            true
        ) as SSLSocket

        ssl.soTimeout = SOCKET_TIMEOUT_MS
        ssl.startHandshake()

        Log.i(TAG, "TLS handshake complete: ${ssl.session.protocol} ${ssl.session.cipherSuite}")

        sslInput = ssl.inputStream
        sslOutput = ssl.outputStream
        sslSocket = ssl

        tunInput = FileInputStream(tunFd.fileDescriptor)
        tunOutput = FileOutputStream(tunFd.fileDescriptor)

        running.set(true)
        onConnected()

        serverToTunThread = Thread({
            serverToTunLoop()
        }, "ServerToTun").also { it.start() }

        tunToServerThread = Thread({
            tunToServerLoop()
        }, "TunToServer").also { it.start() }

        serverToTunThread?.join()
        tunToServerThread?.join()

        stop()
    }

    private fun createSSLContext(): SSLContext {
        val trustManager = if (config.caCert.isNotEmpty()) {
            val cf = CertificateFactory.getInstance("X.509")
            val caBytes = cleanPem(config.caCert)
            val caCert = cf.generateCertificate(caBytes.byteInputStream()) as X509Certificate
            val tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
            val ks = java.security.KeyStore.getInstance("PKCS12")
            ks.load(null, null)
            ks.setCertificateEntry("ca", caCert)
            tmf.init(ks)
            tmf.trustManagers
        } else {
            val tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
            tmf.init(null as java.security.KeyStore?)
            tmf.trustManagers
        }

        val keyManager = if (config.clientCert.isNotEmpty() && config.clientKey.isNotEmpty()) {
            val cf = CertificateFactory.getInstance("X.509")
            val certBytes = cleanPem(config.clientCert)
            val clientCert = cf.generateCertificate(certBytes.byteInputStream()) as X509Certificate

            val keyBytes = cleanPem(config.clientKey)
            val kf = KeyFactory.getInstance("RSA")
            val pkcs8 = PKCS8EncodedKeySpec(Base64.getDecoder().decode(keyBytes))
            val privateKey = kf.generatePrivate(pkcs8)

            val kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
            val ks = java.security.KeyStore.getInstance("PKCS12")
            ks.load(null, null)
            ks.setKeyEntry("client", privateKey, charArrayOf(), arrayOf(clientCert))
            kmf.init(ks, charArrayOf())
            kmf.keyManagers
        } else {
            null
        }

        val sslContext = SSLContext.getInstance("TLSv1.2")
        sslContext.init(keyManager, trustManager, null)
        return sslContext
    }

    private fun cleanPem(pem: String): String {
        return pem.replace(Regex("-----BEGIN [^-]+-----"), "")
            .replace(Regex("-----END [^-]+-----"), "")
            .replace("\\s".toRegex(), "")
    }

    private fun serverToTunLoop() {
        val buffer = ByteArray(OPENVPN_MTU + 64)
        try {
            while (running.get()) {
                val input = sslInput ?: break
                val read = input.read(buffer)
                if (read <= 0) {
                    Thread.sleep(10)
                    continue
                }

                if (read >= 1) {
                    val opcode = (buffer[0].toInt() and 0xFF) shr 3

                    when (opcode) {
                        P_DATA_V1 -> {
                            if (read >= 5) {
                                val payloadSize = read - 5
                                if (payloadSize > 0 && payloadSize < OPENVPN_MTU) {
                                    tunOutput?.write(buffer, 5, payloadSize)
                                    tunOutput?.flush()
                                    bytesIn.addAndGet(payloadSize.toLong())
                                }
                            }
                        }
                        P_ACK_V1 -> {
                            Log.d(TAG, "Received ACK")
                        }
                        P_CONTROL_HARD_RESET_CLIENT_V2, P_PUSH_REQUEST -> {
                            Log.d(TAG, "Server control: opcode=$opcode")
                        }
                        else -> {
                            Log.d(TAG, "Unknown opcode: $opcode")
                        }
                    }
                }
            }
        } catch (e: InterruptedException) {
            Thread.currentThread().interrupt()
        } catch (e: Exception) {
            if (running.get()) {
                Log.e(TAG, "Server-to-TUN error", e)
            }
        }
    }

    private fun tunToServerLoop() {
        val buffer = ByteBuffer.allocate(OPENVPN_MTU + 64)
        try {
            while (running.get()) {
                val input = tunInput ?: break
                buffer.clear()
                val read = input.read(buffer.array())
                if (read <= 0) {
                    Thread.sleep(10)
                    continue
                }

                val output = sslOutput ?: break
                output.write(P_DATA_V1)
                output.write(0)
                output.write(buffer.array(), 0, read)
                output.flush()
                bytesOut.addAndGet(read.toLong())
            }
        } catch (e: InterruptedException) {
            Thread.currentThread().interrupt()
        } catch (e: Exception) {
            if (running.get()) {
                Log.e(TAG, "TUN-to-Server error", e)
            }
        }
    }
}
