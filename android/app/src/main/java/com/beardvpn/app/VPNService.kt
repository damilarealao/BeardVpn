package com.beardvpn.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.atomic.AtomicBoolean

class VPNService : VpnService() {

    companion object {
        private const val TAG = "VPNService"
        private const val CHANNEL_ID = "beardvpn_channel"
        private const val NOTIFICATION_ID = 1
        private var reactContext: com.facebook.react.bridge.ReactApplicationContext? = null
        private val isRunning = AtomicBoolean(false)
        private var vpnInterface: ParcelFileDescriptor? = null
        private var connectionState: String = "DISCONNECTED"

        fun setReactContext(context: com.facebook.react.bridge.ReactApplicationContext) {
            reactContext = context
        }

        fun getConnectionState(): String = connectionState

        fun isServiceRunning(): Boolean = isRunning.get()
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "VPNService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "ACTION_CONNECT" -> startVpn()
            "ACTION_DISCONNECT" -> stopVpn()
            else -> Log.d(TAG, "Unknown action: ${intent?.action}")
        }
        return START_STICKY
    }

    private fun startVpn() {
        if (isRunning.get()) {
            Log.d(TAG, "VPN already running")
            return
        }

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())

        try {
            val builder = Builder()
                .setSession("BeardVPN")
                .setMtu(1500)
                .addAddress("10.0.0.2", 32)
                .addRoute("0.0.0.0", 0)

            vpnInterface = builder.establish()

            if (vpnInterface != null) {
                isRunning.set(true)
                connectionState = "CONNECTED"
                emitStateChange("CONNECTED")
                Log.d(TAG, "VPN connected")
            } else {
                connectionState = "ERROR"
                emitStateChange("ERROR")
                Log.e(TAG, "Failed to establish VPN interface")
                stopSelf()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting VPN", e)
            connectionState = "ERROR"
            emitStateChange("ERROR")
            stopSelf()
        }
    }

    private fun stopVpn() {
        try {
            vpnInterface?.close()
            vpnInterface = null
        } catch (e: Exception) {
            Log.e(TAG, "Error closing VPN interface", e)
        }

        isRunning.set(false)
        connectionState = "DISCONNECTED"
        emitStateChange("DISCONNECTED")
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        Log.d(TAG, "VPN disconnected")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "BeardVPN Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "BeardVPN connection status"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        return builder
            .setContentTitle("BeardVPN")
            .setContentText("VPN is active")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .build()
    }

    private fun emitStateChange(state: String) {
        val params = Arguments.createMap().apply {
            putString("state", state)
            putLong("timestamp", System.currentTimeMillis())
        }
        reactContext
            ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("onVPNStateChanged", params)
    }

    override fun onRevoke() {
        Log.d(TAG, "VPN revoked")
        stopVpn()
        super.onRevoke()
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }
}
