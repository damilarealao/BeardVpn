export interface VPNServer {
  hostName: string;
  ip: string;
  score: number;
  ping: number;
  speed: number;
  countryLong: string;
  countryShort: string;
  numSessions: number;
  uptime: number;
  totalUsers: number;
  totalTraffic: number;
  logType: string;
  operator: string;
  message: string;
  ovpnConfig: string;
  isFree: boolean;
}

export type VPNStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';

export interface VPNConnectionState {
  status: VPNStatus;
  connectedServer: VPNServer | null;
  connectedAt: number | null;
  bytesIn: number;
  bytesOut: number;
  killSwitchMessage: string | null;
}

export interface AppState {
  servers: VPNServer[];
  selectedServer: VPNServer | null;
  connection: VPNConnectionState;
  isLoading: boolean;
  error: string | null;
  premiumUnlocked: boolean;
  premiumExpiresAt: number | null;
}
