package com.beardvpn.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class VPNModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var currentStatus: String = "disconnected"
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

    override fun getName(): String = "VPNModule"

    @ReactMethod
    fun connect(config: ReadableMap, promise: Promise) {
        try {
            val serverIp = config.getString("serverIp") ?: run {
                promise.reject("INVALID_CONFIG", "serverIp is required")
                return
            }
            val ovpnConfig = config.getString("ovpnConfig") ?: ""
            val dns = config.getString("dns") ?: "1.1.1.1"

            registerReceiver()

            val intent = Intent(reactApplicationContext, BeardVpnService::class.java).apply {
                action = BeardVpnService.ACTION_CONNECT
                putExtra("serverIp", serverIp)
                putExtra("ovpnConfig", ovpnConfig)
                putExtra("dns", dns)
            }
            reactApplicationContext.startForegroundService(intent)
            currentStatus = "connecting"
            sendEvent("onVPNStateChanged", Arguments.createMap().apply {
                putString("status", "connecting")
            })
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CONNECT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        try {
            sendEvent("onVPNStateChanged", Arguments.createMap().apply {
                putString("status", "disconnecting")
            })
            currentStatus = "disconnecting"

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
        val map = Arguments.createMap()
        map.putDouble("bytesIn", 0.0)
        map.putDouble("bytesOut", 0.0)
        promise.resolve(map)
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
    }
}
