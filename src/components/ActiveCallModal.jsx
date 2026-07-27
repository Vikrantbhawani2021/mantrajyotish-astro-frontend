import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, Sparkles, User, ShieldAlert } from "lucide-react";
import { endCallApi } from "../config/api";
import { endCallSession, subscribeSocketEvent, emitMediaStateChange } from "../services/socket";
import {
  joinAgoraCallChannel,
  playLocalVideoTrack,
  playRemoteVideoTrack,
  toggleMicrophoneMute,
  toggleCameraState,
  leaveAgoraCallChannel
} from "../services/agoraCall";

export default function ActiveCallModal({ session, onClose }) {
  const [duration, setDuration] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [peerMediaState, setPeerMediaState] = useState({ isAudioMuted: false, isVideoMuted: false });
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [walletWarning, setWalletWarning] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const callId = session?.callId || session?.sessionId || session?._id || session?.id || "";
  const user = session?.user || {};
  const perMinuteRate = Number(session?.perMinuteRate || session?.rate || 25) || 25;
  const callType = (session?.callType || "AUDIO").toUpperCase();
  const isVideoCall = callType === "VIDEO";

  // Extract Agora Token Details from backend response payload
  const agoraObj = session?.agora || session?.data?.agora || {};
  const appId = agoraObj.appId || session?.appId || import.meta.env.VITE_AGORA_APP_ID || "af89ac0f87f4412ea75f23aba4717e04";
  const channelName = agoraObj.channelName || session?.channelName || session?.roomId || `video_${callId}`;
  const token = agoraObj.token || session?.rtcToken || session?.token || null;
  const uid = agoraObj.uid ?? 0;

  // 1. Duration & Billing Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => {
        const nextDur = prev + 1;
        const mins = Math.ceil(nextDur / 60);
        setEarnings((mins * perMinuteRate).toFixed(2));
        return nextDur;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [perMinuteRate]);

  // 2. Initialize Agora RTC Stream
  useEffect(() => {
    let isMounted = true;

    const initCall = async () => {
      console.log("🎬 Joining Agora Call Channel:", channelName, "AppID:", appId, "Type:", callType);

      const res = await joinAgoraCallChannel({
        appId,
        channelName,
        token,
        uid,
        callType,
        callbacks: {
          onRemoteUserJoined: (usr) => {
            console.log("👤 Remote user joined:", usr.uid);
            if (isMounted) {
              setRemoteUser(usr);
              setIsConnected(true);
            }
          },
          onRemoteTrackPublished: (usr, mediaType) => {
            console.log("📹 Remote track published:", mediaType);
            if (isMounted) {
              setRemoteUser(usr);
              setIsConnected(true);
              if (mediaType === "video") {
                setHasRemoteVideo(true);
                setTimeout(() => {
                  if (remoteVideoRef.current) {
                    playRemoteVideoTrack(usr, remoteVideoRef.current);
                  }
                }, 300);
              }
            }
          },
          onRemoteUserLeft: () => {
            console.log("👋 Remote user left the call");
            if (isMounted) {
              setRemoteUser(null);
              setHasRemoteVideo(false);
            }
          }
        }
      });

      if (isMounted) {
        setIsConnected(true);
        if (isVideoCall && res.localVideoTrack && localVideoRef.current) {
          playLocalVideoTrack(localVideoRef.current);
        }
      }
    };

    initCall();

    // Socket subscriptions
    const unsubEnded = subscribeSocketEvent("callEnded", (data) => {
      console.log("🔴 Call ended via socket:", data);
      handleEndCall();
    });

    const unsubTimerTick = subscribeSocketEvent("timerTick", (data) => {
      if (data && data.elapsedMinutes !== undefined) {
        setDuration(data.elapsedMinutes * 60);
        if (data.totalDeducted !== undefined) {
          setEarnings(data.totalDeducted.toFixed(2));
        }
      }
    });

    const unsubWarning = subscribeSocketEvent("walletWarning", (data) => {
      setWalletWarning(data?.message || "User wallet balance is low!");
    });

    const unsubPeerMedia = subscribeSocketEvent("peerMediaStateChanged", (data) => {
      if (data) {
        setPeerMediaState({
          isAudioMuted: !!data.isAudioMuted,
          isVideoMuted: !!data.isVideoMuted
        });
      }
    });

    return () => {
      isMounted = false;
      unsubEnded();
      unsubTimerTick();
      unsubWarning();
      unsubPeerMedia();
      leaveAgoraCallChannel();
    };
  }, [callId, channelName, token, appId, callType]);

  // 3. Play video when elements mount or remote user connects
  useEffect(() => {
    if (isVideoCall && localVideoRef.current) {
      playLocalVideoTrack(localVideoRef.current);
    }
  }, [isVideoCall, isCameraOff]);

  useEffect(() => {
    if (isVideoCall && remoteUser && remoteUser.videoTrack && remoteVideoRef.current) {
      playRemoteVideoTrack(remoteUser, remoteVideoRef.current);
    }
  }, [remoteUser, isVideoCall, hasRemoteVideo]);

  const handleToggleMic = async () => {
    const muted = await toggleMicrophoneMute();
    setIsMuted(muted);
    emitMediaStateChange(callId, muted, isCameraOff);
  };

  const handleToggleCamera = async () => {
    const cameraOff = await toggleCameraState();
    setIsCameraOff(cameraOff);
    emitMediaStateChange(callId, isMuted, cameraOff);
    if (!cameraOff && localVideoRef.current) {
      setTimeout(() => playLocalVideoTrack(localVideoRef.current), 200);
    }
  };

  const handleEndCall = async () => {
    try {
      if (callId) {
        endCallSession(callId);
      }
      await endCallApi(callId);
    } catch (err) {
      console.error("Error ending call:", err);
    } finally {
      leaveAgoraCallChannel();
      onClose();
    }
  };


  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-white overflow-hidden">
      
      {/* Top Header Floating Bar */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80"}
              alt={user?.name || "User"}
              className="w-11 h-11 rounded-full object-cover border-2 border-orange-500"
            />
            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black ${isConnected ? "bg-emerald-500" : "bg-yellow-500 animate-ping"}`}></span>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight text-white">{user?.name || "User Client"}</h3>
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isConnected ? "Connected Live" : "Connecting Stream..."}
            </p>
          </div>
        </div>

        {/* Live Duration & Earnings Badge */}
        <div className="flex items-center gap-2">
          <div className="bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-mono font-bold text-sm tracking-wider">{formatTimer(duration)}</span>
          </div>
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold px-3 py-1 rounded-full text-xs">
            +₹{earnings}
          </div>
        </div>
      </div>

      {/* Wallet Warning Toast Banner */}
      {walletWarning && (
        <div className="absolute top-20 z-30 bg-amber-500/90 backdrop-blur-md text-black font-bold px-4 py-2 rounded-full text-xs flex items-center gap-2 shadow-lg animate-bounce">
          <ShieldAlert className="w-4 h-4 text-black" />
          <span>{walletWarning}</span>
        </div>
      )}

      {/* Peer Muted Status Indicator */}
      {(peerMediaState.isAudioMuted || peerMediaState.isVideoMuted) && (
        <div className="absolute top-20 z-30 bg-red-500/80 backdrop-blur-md text-white font-bold px-3 py-1 rounded-full text-[11px] flex items-center gap-1.5 shadow-md">
          {peerMediaState.isAudioMuted && <MicOff className="w-3.5 h-3.5 text-red-200" />}
          {peerMediaState.isVideoMuted && <VideoOff className="w-3.5 h-3.5 text-red-200" />}
          <span>{user?.name || "User"} muted {peerMediaState.isAudioMuted ? "microphone" : "video"}</span>
        </div>
      )}


      {/* MAIN CALL STREAM CONTAINER */}
      <div className="w-full h-full relative flex items-center justify-center bg-gray-950">

        {isVideoCall ? (
          /* VIDEO CALL INTERFACE */
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Remote Client Video Window */}
            <div
              ref={remoteVideoRef}
              className="w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden"
            >
              {(!hasRemoteVideo || !isConnected) && (
                <div className="flex flex-col items-center gap-4 text-center p-6">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#ff7448] to-[#D53F8C] p-1 animate-pulse">
                      <img
                        src={user?.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80"}
                        alt={user?.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{user?.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">Waiting for remote camera video stream...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Local Astrologer Self Video Preview (Picture in Picture Overlay) */}
            <div className="absolute bottom-28 right-4 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/80 z-20">
              <div ref={localVideoRef} className="w-full h-full object-cover">
                {isCameraOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400 text-xs gap-1">
                    <VideoOff className="w-6 h-6 text-red-400" />
                    <span>Camera Off</span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-1 left-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white font-medium">
                You (Astrologer)
              </div>
            </div>
          </div>
        ) : (
          /* AUDIO CALL INTERFACE */
          <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm px-6 text-center">
            
            {/* Audio Pulse Visualizer Animation */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-44 h-44 rounded-full bg-orange-500/10 animate-ping"></div>
              <div className="absolute w-36 h-36 rounded-full bg-orange-500/20 animate-pulse"></div>
              <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#ff7448] via-amber-500 to-[#D53F8C] shadow-2xl z-10">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80"}
                  alt={user?.name}
                  className="w-full h-full rounded-full object-cover border-4 border-gray-950"
                />
              </div>
            </div>

            {/* User Info & Audio Status */}
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">{user?.name || "Client User"}</h2>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-4 py-1 rounded-full">
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>HD Voice Audio Stream Connected</span>
              </div>
            </div>

            {/* Birth Details Capsule */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-gray-300 flex justify-around">
              <div>
                <span className="text-gray-400 block text-[10px]">DOB</span>
                <span className="font-bold text-white">{user?.dob || "N/A"}</span>
              </div>
              <div className="border-r border-white/10"></div>
              <div>
                <span className="text-gray-400 block text-[10px]">TOB</span>
                <span className="font-bold text-white">{user?.tob || "N/A"}</span>
              </div>
              <div className="border-r border-white/10"></div>
              <div>
                <span className="text-gray-400 block text-[10px]">POB</span>
                <span className="font-bold text-white truncate max-w-[90px] inline-block">{user?.pob || "N/A"}</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Floating Bottom Control Bar */}
      <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center gap-6 px-4">
        
        {/* Toggle Microphone */}
        <button
          onClick={handleToggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl cursor-pointer border ${
            isMuted 
              ? "bg-red-500 text-white border-red-400" 
              : "bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-md"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Toggle Camera (Only for Video Calls) */}
        {isVideoCall && (
          <button
            onClick={handleToggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl cursor-pointer border ${
              isCameraOff 
                ? "bg-red-500 text-white border-red-400" 
                : "bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-md"
            }`}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white flex items-center justify-center shadow-2xl shadow-red-900/60 transition-all active:scale-95 cursor-pointer border border-red-400/30"
          title="End Call"
        >
          <PhoneOff className="w-7 h-7 fill-white" />
        </button>

      </div>

    </div>
  );
}
