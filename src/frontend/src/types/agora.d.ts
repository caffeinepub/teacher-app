// Type declarations for Agora RTC loaded via CDN
declare global {
  interface Window {
    AgoraRTC: AgoraRTCType;
  }
}

interface AgoraRTCType {
  createClient(config: { mode: string; codec: string }): IAgoraRTCClient;
  createMicrophoneAudioTrack(): Promise<IMicrophoneAudioTrack>;
  createCameraVideoTrack(config?: {
    encoderConfig?: string;
    facingMode?: string;
  }): Promise<ICameraVideoTrack>;
  setLogLevel(level: number): void;
}

interface IAgoraRTCClient {
  join(
    appId: string,
    channel: string,
    token: string | null,
    uid?: number | string | null,
  ): Promise<number | string>;
  leave(): Promise<void>;
  publish(tracks: ILocalTrack[]): Promise<void>;
  unpublish(tracks?: ILocalTrack[]): Promise<void>;
  subscribe(
    user: IAgoraRTCRemoteUser,
    mediaType: "audio" | "video",
  ): Promise<void>;
  setClientRole(role: "host" | "audience"): Promise<void>;
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback: (...args: any[]) => void): void;
  remoteUsers: IAgoraRTCRemoteUser[];
  uid: number | string | null;
}

interface ILocalTrack {
  close(): void;
  play(element: string | HTMLElement): void;
  stop(): void;
  enabled: boolean;
  setEnabled(enabled: boolean): Promise<void>;
}

interface IMicrophoneAudioTrack extends ILocalTrack {
  getVolumeLevel(): number;
}

interface ICameraVideoTrack extends ILocalTrack {
  play(element: string | HTMLElement, config?: { mirror?: boolean }): void;
}

interface IAgoraRTCRemoteUser {
  uid: number | string;
  hasVideo: boolean;
  hasAudio: boolean;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
}

interface IRemoteVideoTrack {
  play(element: string | HTMLElement): void;
  stop(): void;
}

interface IRemoteAudioTrack {
  play(): void;
  stop(): void;
}

export {};
