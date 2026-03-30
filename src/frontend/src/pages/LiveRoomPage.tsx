import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Send,
  Settings,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend.d";
import type { ChatMessage as BackendChatMessage } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useClass, useUploadRecording } from "../hooks/useQueries";

interface LiveRoomProps {
  classId: string;
  isTeacher: boolean;
  onLeave: () => void;
}

const AGORA_APP_ID_KEY = "teacher_app_agora_app_id";

function formatSentAt(sentAt: bigint): string {
  return new Date(Number(sentAt / 1_000_000n)).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveRoomPage({
  classId,
  isTeacher,
  onLeave,
}: LiveRoomProps) {
  const { data: classData } = useClass(classId);
  const { actor } = useActor();

  const [appId, setAppId] = useState(
    () => localStorage.getItem(AGORA_APP_ID_KEY) ?? "",
  );
  const [showSettings, setShowSettings] = useState(
    !localStorage.getItem(AGORA_APP_ID_KEY),
  );
  const [appIdInput, setAppIdInput] = useState(
    () => localStorage.getItem(AGORA_APP_ID_KEY) ?? "",
  );

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [agoraError, setAgoraError] = useState<string | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

  const [chatMessages, setChatMessages] = useState<BackendChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatPollRef = useRef<number | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  const clientRef = useRef<any>(null);
  const audioTrackRef = useRef<any>(null);
  const videoTrackRef = useRef<any>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const { mutate: uploadRecording, isPending: uploading } =
    useUploadRecording();

  const localVideoRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    if (joined) {
      timerRef.current = window.setInterval(
        () => setElapsed((e) => e + 1),
        1000,
      );
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [joined]);

  // Chat polling
  const fetchMessages = useCallback(async () => {
    if (!actor) return;
    try {
      const msgs = await actor.getChatMessages(classId);
      setChatMessages(msgs);
    } catch {
      // silently ignore polling errors
    }
  }, [actor, classId]);

  useEffect(() => {
    if (!joined || !actor) {
      if (chatPollRef.current) {
        clearInterval(chatPollRef.current);
        chatPollRef.current = null;
      }
      return;
    }

    // Initial fetch
    setChatLoading(true);
    fetchMessages().finally(() => setChatLoading(false));

    // Poll every 3 seconds
    chatPollRef.current = window.setInterval(fetchMessages, 3000);

    return () => {
      if (chatPollRef.current) {
        clearInterval(chatPollRef.current);
        chatPollRef.current = null;
      }
    };
  }, [joined, actor, fetchMessages]);

  function formatElapsed(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  const joinChannel = useCallback(async () => {
    if (!appId) {
      setShowSettings(true);
      return;
    }
    const AgoraRTC = (window as any).AgoraRTC;
    if (!AgoraRTC) {
      setAgoraError("Agora SDK not loaded. Please refresh the page.");
      return;
    }

    setJoining(true);
    setAgoraError(null);

    try {
      AgoraRTC.setLogLevel(3);
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;

      await client.setClientRole(isTeacher ? "host" : "audience");

      client.on(
        "user-published",
        async (user: any, mediaType: "audio" | "video") => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video" && user.videoTrack) {
            setRemoteUsers((prev: any[]) => {
              if (prev.find((u: any) => u.uid === user.uid)) return prev;
              return [...prev, user];
            });
            setTimeout(() => {
              const el = document.getElementById(`remote-video-${user.uid}`);
              if (el && user.videoTrack) user.videoTrack.play(el);
            }, 100);
          }
          if (mediaType === "audio" && user.audioTrack) {
            user.audioTrack.play();
          }
        },
      );

      client.on("user-unpublished", (user: any) => {
        setRemoteUsers((prev: any[]) =>
          prev.filter((u: any) => u.uid !== user.uid),
        );
      });

      client.on("user-left", (user: any) => {
        setRemoteUsers((prev: any[]) =>
          prev.filter((u: any) => u.uid !== user.uid),
        );
      });

      await client.join(appId, classId, null, null);

      if (isTeacher) {
        const [audioTrack, videoTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack({ encoderConfig: "720p" }),
        ]);
        audioTrackRef.current = audioTrack;
        videoTrackRef.current = videoTrack;
        await client.publish([audioTrack, videoTrack]);

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current, { mirror: true });
        }
      }

      setJoined(true);
    } catch (err: any) {
      setAgoraError(
        err?.message ??
          "Failed to join the classroom. Check your Agora App ID.",
      );
    } finally {
      setJoining(false);
    }
  }, [appId, classId, isTeacher]);

  async function leaveChannel() {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
    }
    audioTrackRef.current?.close();
    videoTrackRef.current?.close();
    await clientRef.current?.leave();
    clientRef.current = null;
    audioTrackRef.current = null;
    videoTrackRef.current = null;
    setJoined(false);
    setRemoteUsers([]);
    onLeave();
  }

  async function toggleMic() {
    if (audioTrackRef.current) {
      await audioTrackRef.current.setEnabled(!micOn);
      setMicOn(!micOn);
    }
  }

  async function toggleCam() {
    if (videoTrackRef.current) {
      await videoTrackRef.current.setEnabled(!camOn);
      setCamOn(!camOn);
    }
  }

  function startRecording() {
    if (!localVideoRef.current) return;
    const videoEl = localVideoRef.current.querySelector(
      "video",
    ) as HTMLVideoElement | null;
    const stream = videoEl?.srcObject;
    if (!stream || !(stream instanceof MediaStream)) {
      toast.error("No local stream to record.");
      return;
    }
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
    });
    recChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recChunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(recChunksRef.current, { type: "video/webm" });
      const arr = new Uint8Array(await blob.arrayBuffer());
      const extBlob = ExternalBlob.fromBytes(arr);
      const durationSec = elapsed;
      uploadRecording(
        {
          classId,
          title: classData?.title ?? "Recording",
          duration: BigInt(durationSec),
          blob: extBlob,
        },
        {
          onSuccess: () => toast.success("Recording saved!"),
          onError: () => toast.error("Failed to save recording."),
        },
      );
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setRecording(true);
    toast.success("Recording started");
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !actor) return;
    const text = chatInput.trim();
    setChatInput("");
    setSendingMessage(true);
    try {
      await actor.sendChatMessage(classId, text);
      await fetchMessages();
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  }

  function saveAppId() {
    localStorage.setItem(AGORA_APP_ID_KEY, appIdInput);
    setAppId(appIdInput);
    setShowSettings(false);
  }

  if (showSettings) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings size={24} style={{ color: "oklch(0.28 0.09 255)" }} />
            <h2 className="text-xl font-bold">Agora Configuration</h2>
          </div>

          <div
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: "oklch(0.96 0.02 250)" }}
          >
            <div className="flex gap-2">
              <AlertCircle
                size={18}
                style={{ color: "oklch(0.34 0.11 255)", marginTop: 2 }}
                className="shrink-0"
              />
              <div
                className="text-sm"
                style={{ color: "oklch(0.28 0.09 255)" }}
              >
                <p className="font-semibold mb-1">Agora App ID Required</p>
                <p>
                  To enable live audio/video streaming, you need an Agora App
                  ID. Get yours free at{" "}
                  <a
                    href="https://console.agora.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    console.agora.io
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="agora-app-id"
                className="text-sm font-semibold text-gray-700 block mb-1.5"
              >
                Agora App ID
              </label>
              <Input
                id="agora-app-id"
                data-ocid="live.agora_app_id.input"
                value={appIdInput}
                onChange={(e) => setAppIdInput(e.target.value)}
                placeholder="Enter your Agora App ID"
                className="font-mono"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={saveAppId}
                data-ocid="live.save_app_id.button"
                disabled={!appIdInput.trim()}
                className="flex-1 text-white"
                style={{ backgroundColor: "oklch(0.28 0.09 255)" }}
              >
                Save & Continue
              </Button>
              {appId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 min-h-screen flex flex-col">
      {/* Room Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: "oklch(0.18 0.05 255)" }}
      >
        <div className="flex items-center gap-3">
          {joined && (
            <Badge className="live-red text-white text-xs px-2 py-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot" />
              LIVE
            </Badge>
          )}
          <span className="text-white font-semibold text-sm truncate max-w-xs">
            {classData?.title ?? "Live Classroom"}
          </span>
          {joined && (
            <span className="text-white/50 text-sm font-mono">
              {formatElapsed(elapsed)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            data-ocid="live.settings.button"
            className="text-white/50 hover:text-white p-1.5 rounded"
          >
            <Settings size={16} />
          </button>
          <span className="text-white/50 text-sm flex items-center gap-1">
            <Users size={14} />
            {1 + remoteUsers.length}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-gray-900 p-4 relative min-h-[300px] lg:min-h-0">
            {!joined ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                {agoraError ? (
                  <div
                    className="text-center max-w-sm px-4"
                    data-ocid="live.error_state"
                  >
                    <AlertCircle
                      size={40}
                      className="text-red-400 mx-auto mb-3"
                    />
                    <p className="text-white font-semibold mb-2">
                      Connection Failed
                    </p>
                    <p className="text-white/60 text-sm mb-4">{agoraError}</p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        type="button"
                        onClick={() => setShowSettings(true)}
                        variant="outline"
                        className="border-white/20 text-white"
                      >
                        <Settings size={14} className="mr-1.5" />
                        Configure
                      </Button>
                      <Button
                        type="button"
                        onClick={joinChannel}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Video size={36} className="text-white/40" />
                    </div>
                    <p className="text-white font-semibold mb-1">
                      {isTeacher
                        ? "Start your live class"
                        : "Join the live class"}
                    </p>
                    <p className="text-white/40 text-sm mb-6">
                      {classData?.description ?? ""}
                    </p>
                    <Button
                      type="button"
                      onClick={joinChannel}
                      disabled={joining}
                      data-ocid="live.join.primary_button"
                      className="px-8 py-3 text-white font-semibold h-auto"
                      style={{ backgroundColor: "oklch(0.63 0.24 25)" }}
                    >
                      {joining ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Connecting...
                        </>
                      ) : isTeacher ? (
                        <>
                          <Video size={18} className="mr-2" />
                          Go Live
                        </>
                      ) : (
                        <>
                          <Video size={18} className="mr-2" />
                          Join Class
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="h-full grid gap-3"
                style={{
                  gridTemplateColumns:
                    remoteUsers.length > 0 ? "1fr 1fr" : "1fr",
                }}
              >
                {isTeacher ? (
                  <div className="relative rounded-xl overflow-hidden bg-gray-800">
                    <div
                      ref={localVideoRef}
                      className="w-full h-full"
                      style={{ minHeight: "240px" }}
                    />
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                        You (Host)
                      </span>
                    </div>
                    {!camOn && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <VideoOff size={40} className="text-white/30" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="relative rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center"
                    style={{ minHeight: "240px" }}
                  >
                    <div className="text-center">
                      <Users size={40} className="text-white/30 mx-auto mb-2" />
                      <p className="text-white/50 text-sm">
                        Watching as student
                      </p>
                    </div>
                  </div>
                )}

                {remoteUsers.map((user: any) => (
                  <div
                    key={user.uid}
                    className="relative rounded-xl overflow-hidden bg-gray-800"
                    style={{ minHeight: "240px" }}
                  >
                    <div
                      id={`remote-video-${user.uid}`}
                      className="w-full h-full"
                    />
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                        Student
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {joined && (
            <div
              className="px-4 py-3 flex items-center justify-center gap-3 flex-wrap"
              style={{ backgroundColor: "oklch(0.18 0.05 255)" }}
            >
              {isTeacher && (
                <>
                  <button
                    type="button"
                    onClick={toggleMic}
                    data-ocid="live.mic.toggle"
                    className={`p-3 rounded-full transition-colors ${
                      micOn
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-red-500/80 hover:bg-red-500 text-white"
                    }`}
                    title={micOn ? "Mute mic" : "Unmute mic"}
                  >
                    {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleCam}
                    data-ocid="live.camera.toggle"
                    className={`p-3 rounded-full transition-colors ${
                      camOn
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-red-500/80 hover:bg-red-500 text-white"
                    }`}
                    title={camOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>
                  <button
                    type="button"
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    title="Share screen (coming soon)"
                  >
                    <MonitorUp size={20} />
                  </button>
                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      data-ocid="live.start_recording.button"
                      className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-white flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      Record
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      data-ocid="live.stop_recording.button"
                      disabled={uploading}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-red-500/80 hover:bg-red-500 text-white flex items-center gap-2"
                    >
                      {uploading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />
                      )}
                      {uploading ? "Saving..." : "Stop"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={leaveChannel}
                    data-ocid="live.end_class.delete_button"
                    className="px-5 py-2 rounded-full text-sm font-semibold bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                  >
                    <PhoneOff size={16} />
                    End Class
                  </button>
                </>
              )}
              {!isTeacher && (
                <button
                  type="button"
                  onClick={leaveChannel}
                  data-ocid="live.leave.button"
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                >
                  <PhoneOff size={16} />
                  Leave Class
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat */}
        <div
          className="w-full lg:w-80 flex flex-col border-l border-white/10"
          style={{ backgroundColor: "oklch(0.20 0.05 255)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white font-semibold text-sm flex items-center gap-2">
              <MessageSquare size={15} />
              Live Chat
            </span>
            <span className="text-white/40 text-xs">
              {chatMessages.length} messages
            </span>
          </div>

          <ScrollArea
            className="flex-1 px-4 py-3"
            style={{ maxHeight: "calc(100vh - 280px)" }}
          >
            {chatLoading ? (
              <div
                className="flex items-center justify-center py-8"
                data-ocid="live.chat.loading_state"
              >
                <Loader2 size={20} className="animate-spin text-white/40" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-8 text-center"
                data-ocid="live.chat.empty_state"
              >
                <MessageSquare size={28} className="text-white/20 mb-2" />
                <p className="text-white/40 text-xs">
                  No messages yet.
                  <br />
                  Be the first to say hello!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id}>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: "oklch(0.80 0.05 250)",
                        }}
                      >
                        {msg.senderName}
                      </span>
                      <span className="text-white/30 text-xs">
                        {formatSentAt(msg.sentAt)}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm mt-0.5">{msg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <form
            onSubmit={sendMessage}
            className="px-3 py-3 border-t border-white/10 flex gap-2"
          >
            <Input
              data-ocid="live.chat.input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={joined ? "Send a message..." : "Join to chat"}
              disabled={!joined || sendingMessage}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-sm"
            />
            <Button
              type="submit"
              size="icon"
              data-ocid="live.chat.submit_button"
              disabled={!joined || sendingMessage || !chatInput.trim()}
              className="shrink-0"
              style={{ backgroundColor: "oklch(0.28 0.09 255)" }}
            >
              {sendingMessage ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
