package com.beardvpn.app

import android.content.Intent
import android.net.VpnService
import android.app.Activity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class VPNModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var vpnServiceIntent: Intent? = null
    private var currentStatus: String = "disconnected"
    private var bytesIn: Long = 0
    private var bytesOut: Long = 0

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

            startVpnService(serverIp, ovpnConfig, dns)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CONNECT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        try {
            sendEvent("onVPNStateChanged", "disconnecting")
            currentStatus = "disconnecting"

            val intent = Intent(reactApplicationContext, BeardVpnService::class.java)
            intent.action = BeardVpnService.ACTION_DISCONNECT
            reactApplicationContext.startService(intent)

            currentStatus = "disconnected"
            sendEvent("onVPNStateChanged", "disconnected")
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
        map.putDouble("bytesIn", bytesIn.toDouble())
        map.putDouble("bytesOut", bytesOut.toDouble())
        promise.resolve(map)
    }

    private fun startVpnService(serverIp: String, ovpnConfig: String, dns: String) {
        vpnServiceIntent = Intent(reactApplicationContext, BeardVpnService::class.java).apply {
            action = BeardVpnService.ACTION_CONNECT
            putExtra("serverIp", serverIp)
            putExtra("ovpnConfig", ovpnConfig)
            putExtra("dns", dns)
        }
        reactApplicationContext.startService(vpnServiceIntent)
        currentStatus = "connecting"
        sendEvent("onVPNStateChanged", "connecting")
    }

    private fun sendEvent(eventName: String, status: String) {
        val map = Arguments.createMap()
        map.putString("status", status)
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, map)
    }

    companion object {
        const val VPN_REQUEST_CODE = 24601
    }
}
