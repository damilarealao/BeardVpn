package com.beardvpn.app

import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class VPNModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "VPNModule"

    init {
        VPNService.setReactContext(reactContext)
    }

    @ReactMethod
    fun connect(config: ReadableMap, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, VPNService::class.java).apply {
                action = "ACTION_CONNECT"
            }
            reactApplicationContext.startForegroundService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("VPN_CONNECT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, VPNService::class.java).apply {
                action = "ACTION_DISCONNECT"
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("VPN_DISCONNECT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        val map = Arguments.createMap().apply {
            putString("state", VPNService.getConnectionState())
            putBoolean("isRunning", VPNService.isServiceRunning())
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun getStats(promise: Promise) {
        val map = Arguments.createMap().apply {
            putLong("bytesIn", 0)
            putLong("bytesOut", 0)
            putLong("duration", 0)
            putString("state", VPNService.getConnectionState())
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter
    }
}
