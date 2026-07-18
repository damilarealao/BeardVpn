import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { VPNStatus, VPNServer } from '../types';

interface VPNModuleInterface {
  connect(config: { serverIp: string; ovpnConfig: string; dns: string }): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): Promise<{ status: string }>;
  getStats(): Promise<{ bytesIn: number; bytesOut: number }>;
}

const { VPNModule } = NativeModules;

const vpnEmitter = VPNModule
  ? new NativeEventEmitter(VPNModule)
  : null;

export const vpnService: VPNModuleInterface = VPNModule
  ? {
      connect: (config) => VPNModule.connect(config),
      disconnect: () => VPNModule.disconnect(),
      getStatus: () => VPNModule.getStatus(),
      getStats: () => VPNModule.getStats(),
    }
  : {
      connect: async () => {
        throw new Error(
          'VPN native module not available. Run `npx expo prebuild` and build for Android.'
        );
      },
      disconnect: async () => {},
      getStatus: async () => ({ status: 'disconnected' }),
      getStats: async () => ({ bytesIn: 0, bytesOut: 0 }),
    };

export function onVPNStateChanged(callback: (status: VPNStatus) => void) {
  if (!vpnEmitter) return () => {};
  const subscription = vpnEmitter.addListener('onVPNStateChanged', (event: any) => {
    const status = event?.status || event;
    callback(status as VPNStatus);
  });
  return () => subscription.remove();
}

export function isNativeModuleAvailable(): boolean {
  return VPNModule != null;
}
