package com.beardvpn.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.ByteBuffer

class BeardVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var isRunning = false
    private var serverIp: String = ""
    private var dns: String = "1.1.1.1"

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_CONNECT -> {
                serverIp = intent.getStringExtra("serverIp") ?: ""
                dns = intent.getStringExtra("dns") ?: "1.1.1.1"
                val ovpnConfig = intent.getStringExtra("ovpnConfig") ?: ""
                startVpn(serverIp, dns)
            }
            ACTION_DISCONNECT -> {
                stopVpn()
            }
            else -> {}
        }
        return START_STICKY
    }

    private fun startVpn(serverIp: String, dns: String) {
        try {
            val builder = Builder()
            builder.setSession("BeardVpn")
            builder.addAddress("10.0.0.2", 32)
            builder.addRoute("0.0.0.0", 0)
            builder.addDnsServer(dns)
            builder.setMtu(1500)
            builder.setBlocking(true)

            vpnInterface = builder.establish()
            if (vpnInterface == null) {
                stopSelf()
                return
            }

            isRunning = true
            createNotificationChannel()
            startForeground(NOTIFICATION_ID, buildNotification("Connected to $serverIp"))
        } catch (e: Exception) {
            stopSelf()
        }
    }

    private fun stopVpn() {
        isRunning = false
        vpnInterface?.close()
        vpnInterface = null
        stopForeground(true)
        stopSelf()
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

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }

    companion object {
        const val ACTION_CONNECT = "com.beardvpn.ACTION_CONNECT"
        const val ACTION_DISCONNECT = "com.beardvpn.ACTION_DISCONNECT"
        const val CHANNEL_ID = "beardvpn_channel"
        const val NOTIFICATION_ID = 1
    }
}
