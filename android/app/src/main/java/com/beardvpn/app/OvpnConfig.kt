package com.beardvpn.app

data class OvpnConfig(
    val serverHost: String,
    val serverPort: Int,
    val protocol: String,
    val caCert: String,
    val clientCert: String,
    val clientKey: String,
    val tlsAuthKey: String,
    val cipher: String,
    val auth: String,
    val mtu: Int,
    val dnsServers: List<String>,
    val routes: List<String>,
    val remoteCertTls: String
) {
    companion object {
        fun parse(ovpnText: String): OvpnConfig? {
            val lines = ovpnText.lines().map { it.trim() }
            var serverHost = ""
            var serverPort = 1194
            var protocol = "tcp"
            var caCert = StringBuilder()
            var clientCert = StringBuilder()
            var clientKey = StringBuilder()
            var tlsAuthKey = StringBuilder()
            var cipher = "AES-256-CBC"
            var auth = "SHA256"
            var mtu = 1500
            val dnsServers = mutableListOf("1.1.1.1", "8.8.8.8")
            val routes = mutableListOf<String>()
            var remoteCertTls = "server"
            var inBlock: String? = null

            for (line in lines) {
                when {
                    line.startsWith("<ca>") -> { inBlock = "ca"; continue }
                    line.startsWith("</ca>") -> { inBlock = null; continue }
                    line.startsWith("<cert>") -> { inBlock = "cert"; continue }
                    line.startsWith("</cert>") -> { inBlock = null; continue }
                    line.startsWith("<key>") -> { inBlock = "key"; continue }
                    line.startsWith("</key>") -> { inBlock = null; continue }
                    line.startsWith("<tls-auth>") -> { inBlock = "tlsauth"; continue }
                    line.startsWith("</tls-auth>") -> { inBlock = null; continue }
                    line.startsWith("#") || line.isEmpty() -> continue
                }

                when (inBlock) {
                    "ca" -> caCert.append(line).append("\n")
                    "cert" -> clientCert.append(line).append("\n")
                    "key" -> clientKey.append(line).append("\n")
                    "tlsauth" -> tlsAuthKey.append(line).append("\n")
                }

                if (inBlock != null) continue

                val parts = line.split("\\s+".toRegex(), limit = 2)
                if (parts.size < 2) continue
                val key = parts[0].lowercase()
                val value = parts[1].trim('"')

                when (key) {
                    "remote" -> {
                        val remoteParts = value.split("\\s+".toRegex())
                        serverHost = remoteParts[0]
                        if (remoteParts.size > 1) {
                            serverPort = remoteParts[1].toIntOrNull() ?: 1194
                        }
                    }
                    "proto" -> protocol = value.lowercase()
                    "cipher" -> cipher = value
                    "auth" -> auth = value
                    "tun-mtu" -> mtu = value.toIntOrNull() ?: 1500
                    "dhcp-option" -> {
                        val optParts = value.split("\\s+".toRegex(), limit = 2)
                        if (optParts.size >= 2 && optParts[0].uppercase() == "DNS") {
                            dnsServers.add(optParts[1])
                        }
                    }
                    "route" -> routes.add(value)
                    "remote-cert-tls" -> remoteCertTls = value
                }
            }

            if (serverHost.isEmpty() || caCert.isEmpty()) return null

            return OvpnConfig(
                serverHost = serverHost,
                serverPort = serverPort,
                protocol = protocol,
                caCert = caCert.toString().trim(),
                clientCert = clientCert.toString().trim(),
                clientKey = clientKey.toString().trim(),
                tlsAuthKey = tlsAuthKey.toString().trim(),
                cipher = cipher,
                auth = auth,
                mtu = mtu,
                dnsServers = dnsServers.distinct().take(3),
                routes = routes,
                remoteCertTls = remoteCertTls
            )
        }
    }
}
