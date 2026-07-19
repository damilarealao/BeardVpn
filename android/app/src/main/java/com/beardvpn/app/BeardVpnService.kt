package com.beardvpn.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log

class BeardVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var openVpnClient: OpenVpnClient? = null
    private var isRunning = false

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "onStartCommand action=${intent?.action}")

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification("BeardVpn"))

        when (intent?.action) {
            ACTION_CONNECT -> {
                val ovpnConfig = intent.getStringExtra("ovpnConfig") ?: ""
                val serverIp = intent.getStringExtra("serverIp") ?: ""
                val dns = intent.getStringExtra("dns") ?: "1.1.1.1"
                Log.i(TAG, "Connecting to $serverIp dns=$dns configLen=${ovpnConfig.length}")
                startVpn(serverIp, dns, ovpnConfig)
            }
            ACTION_DISCONNECT -> {
                Log.i(TAG, "Disconnecting")
                stopVpn()
            }
            else -> {
                Log.w(TAG, "Null or unknown action, stopping service")
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun startVpn(serverIp: String, dns: String, ovpnConfigStr: String) {
        try {
            val config = if (ovpnConfigStr.isNotEmpty()) {
                OvpnConfig.parse(ovpnConfigStr)
            } else null

            if (config != null) {
                Log.i(TAG, "Parsed OVPN: host=${config.serverHost} port=${config.serverPort} proto=${config.protocol}")
            } else {
                Log.w(TAG, "No OVPN config or parse failed, using raw TUN")
            }

            val mtu = config?.mtu ?: 1500
            val dnsServer = config?.dnsServers?.firstOrNull() ?: dns

            val builder = Builder()
            builder.setSession("BeardVpn")
            builder.addAddress("10.0.0.2", 32)
            builder.addRoute("0.0.0.0", 0)
            builder.addDnsServer(dnsServer)
            builder.setMtu(mtu)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                builder.setMetered(false)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                builder.setHttpProxy(android.net.ProxyInfo.buildDirectProxy("localhost", 0))
            }

            vpnInterface = builder.establish()
            if (vpnInterface == null) {
                Log.e(TAG, "VPN establish() returned null - permission may not be granted")
                sendEvent("onVPNStateChanged", "error")
                sendErrorEvent("VPN permission not granted or interface creation failed")
                stopSelf()
                return
            }

            Log.i(TAG, "VPN interface established successfully, fd=${vpnInterface?.fd}")
            isRunning = true
            updateNotification("Connecting to $serverIp...")

            if (config != null) {
                openVpnClient = OpenVpnClient(
                    vpnService = this,
                    config = config,
                    tunFd = vpnInterface!!,
                    onConnected = {
                        Log.i(TAG, "OpenVPN TLS handshake complete")
                        updateNotification("Connected to $serverIp")
                        sendEvent("onVPNStateChanged", "connected")
                    },
                    onDisconnected = {
                        Log.i(TAG, "OpenVPN disconnected")
                        isRunning = false
                        sendEvent("onVPNStateChanged", "disconnected")
                    },
                    onError = { error ->
                        Log.e(TAG, "OpenVPN error: $error")
                        sendEvent("onVPNStateChanged", "error")
                        sendErrorEvent(error)
                    }
                )
                openVpnClient?.start()
            } else {
                Log.i(TAG, "No config, sending connected event (raw TUN mode)")
                updateNotification("Connected to $serverIp")
                sendEvent("onVPNStateChanged", "connected")
            }

        } catch (e: Exception) {
            Log.e(TAG, "VPN start failed: ${e.message}", e)
            sendEvent("onVPNStateChanged", "error")
            sendErrorEvent("VPN start failed: ${e.message}")
            stopSelf()
        }
    }

    private fun stopVpn() {
        isRunning = false
        openVpnClient?.stop()
        openVpnClient = null
        try {
            vpnInterface?.close()
        } catch (e: Exception) {
            Log.w(TAG, "Error closing VPN interface: ${e.message}")
        }
        vpnInterface = null
        sendEvent("onVPNStateChanged", "disconnected")
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    fun getStats(): Pair<Long, Long> {
        val client = openVpnClient
        return if (client != null) {
            Pair(client.bytesIn.get(), client.bytesOut.get())
        } else {
            Pair(0L, 0L)
        }
    }

    private fun sendEvent(eventName: String, status: String) {
        val intent = Intent(ACTION_VPN_EVENT).apply {
            putExtra("event", eventName)
            putExtra("status", status)
        }
        sendBroadcast(intent)
    }

    private fun sendErrorEvent(message: String) {
        val intent = Intent(ACTION_VPN_EVENT).apply {
            putExtra("event", "onVPNSError")
            putExtra("status", "error")
            putExtra("message", message)
        }
        sendBroadcast(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "BeardVpn",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "VPN connection status"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("BeardVpn")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("BeardVpn")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build()
        }
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification(text))
    }

    override fun onDestroy() {
        Log.i(TAG, "onDestroy")
        stopVpn()
        super.onDestroy()
    }

    companion object {
        const val ACTION_CONNECT = "com.beardvpn.ACTION_CONNECT"
        const val ACTION_DISCONNECT = "com.beardvpn.ACTION_DISCONNECT"
        const val ACTION_VPN_EVENT = "com.beardvpn.VPN_EVENT"
        const val CHANNEL_ID = "beardvpn_channel"
        const val NOTIFICATION_ID = 1
        private const val TAG = "BeardVpnService"
    }
}
