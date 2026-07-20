package com.beardvpn.app

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.ServiceConnection
import android.net.VpnService
import android.os.IBinder
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class VPNModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext),
    ActivityEventListener {

    private var currentStatus: String = "disconnected"
    private var pendingPromise: Promise? = null
    private var pendingConfig: Triple<String, String, String>? = null
    private val VPN_PERMISSION_REQUEST = 1001
    private var vpnService: BeardVpnService? = null
    private var bound = false

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as BeardVpnService.LocalBinder
            vpnService = binder.getService()
        }
        override fun onServiceDisconnected(name: ComponentName?) {
            vpnService = null
        }
    }

    private val eventReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val event = intent?.getStringExtra("event") ?: return
            val status = intent.getStringExtra("status") ?: return
            currentStatus = status
            sendEvent(event, Arguments.createMap().apply {
                putString("status", status)
            })
        }
    }
    private var receiverRegistered = false

    init {
        reactApplicationContext.addActivityEventListener(this)
        registerReceiver()
        bindToService()
    }

    override fun getName(): String = "VPNModule"

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    @ReactMethod
    fun connect(config: ReadableMap, promise: Promise) {
        try {
            val serverIp = config.getString("serverIp") ?: run {
                promise.reject("INVALID_CONFIG", "serverIp is required")
                return
            }
            val ovpnConfig = config.getString("ovpnConfig") ?: ""
            val dns = config.getString("dns") ?: "1.1.1.1"

            val prepareIntent = VpnService.prepare(reactApplicationContext)
            if (prepareIntent != null) {
                val activity = reactApplicationContext.currentActivity
                if (activity != null) {
                    pendingPromise = promise
                    pendingConfig = Triple(serverIp, ovpnConfig, dns)
                    activity.startActivityForResult(prepareIntent, VPN_PERMISSION_REQUEST)
                } else {
                    promise.reject("NO_ACTIVITY", "No current activity")
                }
                return
            }

            startVpnService(serverIp, ovpnConfig, dns, promise)
        } catch (e: Exception) {
            promise.reject("CONNECT_ERROR", e.message, e)
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == VPN_PERMISSION_REQUEST) {
            val promise = pendingPromise
            val config = pendingConfig
            pendingPromise = null
            pendingConfig = null

            if (resultCode == Activity.RESULT_OK && config != null) {
                startVpnService(config.first, config.second, config.third, promise!!)
            } else {
                promise?.reject("VPN_PERMISSION", "VPN permission denied by user")
            }
        }
    }

    override fun onNewIntent(intent: Intent) {}

    private fun startVpnService(serverIp: String, ovpnConfig: String, dns: String, promise: Promise) {
        val intent = Intent(reactApplicationContext, BeardVpnService::class.java).apply {
            action = BeardVpnService.ACTION_CONNECT
            putExtra("serverIp", serverIp)
            putExtra("ovpnConfig", ovpnConfig)
            putExtra("dns", dns)
        }
        reactApplicationContext.startForegroundService(intent)
        bindToService()
        currentStatus = "connecting"
        sendEvent("onVPNStateChanged", Arguments.createMap().apply {
            putString("status", "connecting")
        })
        promise.resolve(null)
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, BeardVpnService::class.java).apply {
                action = BeardVpnService.ACTION_DISCONNECT
            }
            reactApplicationContext.startService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("DISCONNECT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        val map = Arguments.createMap()
        map.putString("status", currentStatus)
        promise.resolve(map)
    }

    @ReactMethod
    fun getStats(promise: Promise) {
        val stats = vpnService?.getStats()
        val map = Arguments.createMap()
        map.putDouble("bytesIn", stats?.first?.toDouble() ?: 0.0)
        map.putDouble("bytesOut", stats?.second?.toDouble() ?: 0.0)
        promise.resolve(map)
    }

    private fun bindToService() {
        if (bound) return
        val intent = Intent(reactApplicationContext, BeardVpnService::class.java)
        try {
            reactApplicationContext.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
            bound = true
        } catch (_: Exception) {}
    }

    private fun registerReceiver() {
        if (!receiverRegistered) {
            val filter = IntentFilter(BeardVpnService.ACTION_VPN_EVENT)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                reactApplicationContext.registerReceiver(eventReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                reactApplicationContext.registerReceiver(eventReceiver, filter)
            }
            receiverRegistered = true
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun onCatalystInstanceDestroy() {
        if (receiverRegistered) {
            try {
                reactApplicationContext.unregisterReceiver(eventReceiver)
            } catch (_: Exception) {}
            receiverRegistered = false
        }
        if (bound) {
            try {
                reactApplicationContext.unbindService(serviceConnection)
            } catch (_: Exception) {}
            bound = false
        }
    }
}
