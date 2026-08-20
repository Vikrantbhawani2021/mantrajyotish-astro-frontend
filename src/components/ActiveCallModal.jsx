import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, Sparkles, User, ShieldAlert, Calendar, Clock, MapPin } from "lucide-react";
import { endCallApi } from "../config/api";
import { endCallSession, subscribeSocketEvent, emitMediaStateChange, joinCallRoom } from "../services/socket";
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
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [peerMediaState, setPeerMediaState] = useState({ isAudioMuted: false, isVideoMuted: false });
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [walletWarning, setWalletWarning] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const durationRef = useRef(0);
  durationRef.current = duration;
  const currentEarningsRef = useRef("0.00");

  const callId = session?.callId || session?.sessionId || session?._id || session?.id || "";
  const user = session?.user || session?.session?.user || {};
  
  const clientName = user?.name || (user?.firstname || user?.lastname ? `${user.firstname || ""} ${user.lastname || ""}`.trim() : null) || "Client User";
  const perMinuteRate = Number(session?.perMinuteRate || session?.rate || 25) || 25;
  const callType = (session?.callType || "AUDIO").toUpperCase();
  const isVideoCall = callType === "VIDEO";

  const dob = user?.dob || user?.dateofbirth || "Not Specified";
  const tob = user?.tob || user?.timeofbirth || "Not Specified";
  const pob = user?.pob || user?.placeofbirth || "Not Specified";

  // Extract Agora Token Details from backend response payload
  const agoraObj = session?.agora || session?.data?.agora || {};
  const appId = agoraObj.appId || session?.appId || import.meta.env.VITE_AGORA_APP_ID || "af89ac0f87f4412ea75f23aba4717e04";
  const channelName = agoraObj.channelName || session?.channelName || session?.roomId || `video_${callId}`;
  const token = agoraObj.token || session?.rtcToken || session?.token || null;
  const uid = agoraObj.uid ?? 0;

  // Format DOB Date format safely (e.g. YYYY-MM-DD -> DD/MM/YYYY)
  const formatDob = (dateVal) => {
    if (!dateVal || dateVal === "Not Specified" || dateVal === "N/A") return "Not Specified";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // 1. Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Initialize Agora RTC Stream & Socket Signalling
  useEffect(() => {
    let isMounted = true;

    // Join socket calling room to receive sync events
    if (callId) {
      joinCallRoom(callId);
    }

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
      console.log("🔴 Call ended via socket event:", data);
      handleEndCall();
    });

    const unsubTimerTick = subscribeSocketEvent("timerTick", (data) => {
      if (data) {
        if (data.elapsedMinutes !== undefined) {
          setDuration(data.elapsedMinutes * 60);
        } else if (data.elapsedSeconds !== undefined) {
          setDuration(data.elapsedSeconds);
        }
      }
    });

    const unsubWarning = subscribeSocketEvent("walletWarning", (data) => {
      setWalletWarning(data?.message || "User wallet balance is low!");
    });

    const unsubPeerMedia = subscribeSocketEvent("peer_media_state_changed", (data) => {
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
    let summary = null;
    try {
      if (callId) {
        endCallSession(callId);
      }
      const res = await endCallApi(callId);
      
      const finalEarning = Number(res?.data?.astrologerEarnings || res?.astrologerEarnings || currentEarningsRef.current).toFixed(2);
      const finalSecs = res?.data?.totalDurationSeconds || res?.totalDurationSeconds || durationRef.current;
      
      summary = {
        clientName: clientName,
        type: isVideoCall ? "Video Call" : "Audio Call",
        duration: formatTimer(finalSecs),
        earnings: finalEarning
      };
    } catch (err) {
      console.error("Error ending call:", err);
      summary = {
        clientName: clientName,
        type: isVideoCall ? "Video Call" : "Audio Call",
        duration: formatTimer(durationRef.current),
        earnings: Number(currentEarningsRef.current).toFixed(2)
      };
    } finally {
      leaveAgoraCallChannel();
      onClose(summary);
    }
  };

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Compute live synchronized earnings directly from the elapsed duration
  const elapsedMinutes = Math.max(1, Math.ceil(duration / 60));
  const currentEarnings = (elapsedMinutes * perMinuteRate).toFixed(2);
  currentEarningsRef.current = currentEarnings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-white overflow-hidden animate-fade-in">
      
      {/* Top Header Floating Bar */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80"}
              alt={clientName}
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-slate-900 ${isConnected ? "bg-green-500" : "bg-yellow-500 animate-ping"}`}></span>
          </div>
          <div>
            <h3 className="font-bold text-xs md:text-sm leading-tight text-white">{clientName}</h3>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {isConnected ? "Connected Live" : "Connecting Stream..."}
            </p>
          </div>
        </div>

        {/* Live Duration & Earnings Badges */}
        <div className="flex items-center gap-2">
          {/* Timer Capsule */}
          <div className="bg-black/45 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="font-mono font-bold text-xs tracking-wider text-white">{formatTimer(duration)}</span>
          </div>
          {/* Earnings Capsule */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-3.5 py-1.5 rounded-full text-xs shadow-md">
            +₹{currentEarnings}
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
          <span>{clientName} muted {peerMediaState.isAudioMuted ? "microphone" : "video"}</span>
        </div>
      )}

      {/* MAIN CALL STREAM CONTAINER */}
      <div className="w-full h-full relative flex items-center justify-center bg-gray-950">

        {isVideoCall ? (
          /* VIDEO CALL INTERFACE */
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Remote Client Video Window */}
            <div className="w-full h-full bg-slate-900 relative overflow-hidden">
              <div
                ref={remoteVideoRef}
                className="w-full h-full flex items-center justify-center"
              />
              {(!hasRemoteVideo || !isConnected) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6 bg-slate-900 z-10">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#ff7448] to-[#D53F8C] p-1 animate-pulse">
                      <img
                        src={user?.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80"}
                        alt={clientName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{clientName}</h3>
                    <p className="text-xs text-gray-400 mt-1">Waiting for remote camera video stream...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Local Astrologer Self Video Preview (Picture in Picture Overlay) */}
            <div className="absolute bottom-28 right-4 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/80 z-20">
              <div ref={localVideoRef} className="w-full h-full" />
              {isCameraOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-400 text-xs gap-1 z-10">
                  <VideoOff className="w-6 h-6 text-red-400" />
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1 left-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white font-medium z-10">
                You (Astrologer)
              </div>
            </div>
          </div>
        ) : (
          /* AUDIO CALL INTERFACE */
          <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm px-6 text-center">
            
            {/* Audio Pulse Visualizer Animation */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-44 h-44 rounded-full bg-[#ff7448]/10 animate-ping"></div>
              <div className="absolute w-36 h-36 rounded-full bg-[#ff7448]/20 animate-pulse"></div>
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#ff7448] via-yellow-500 to-[#D53F8C] shadow-2xl z-10 flex items-center justify-center">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80"}
                  alt={clientName}
                  className="w-full h-full rounded-full object-cover border-2 border-gray-950"
                />
              </div>
            </div>

            {/* User Info & Audio Status */}
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">{clientName}</h2>
              <div className="mt-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span>HD Voice Audio Stream Connected</span>
              </div>
            </div>

            {/* Birth Details Capsule */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-300 flex justify-around mt-8 shadow-sm">
              <div className="text-center">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">DOB</span>
                <span className="font-bold text-white text-xs">{formatDob(dob)}</span>
              </div>
              <div className="border-r border-white/10 h-8 self-center"></div>
              <div className="text-center">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">TOB</span>
                <span className="font-bold text-white text-xs">{tob}</span>
              </div>
              <div className="border-r border-white/10 h-8 self-center"></div>
              <div className="text-center">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">POB</span>
                <span className="font-bold text-white text-xs truncate max-w-[100px] inline-block" title={pob}>{pob}</span>
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
              : "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="w-5.5 h-5.5" /> : <Mic className="w-5.5 h-5.5" />}
        </button>

        {/* Toggle Camera (Only for Video Calls) */}
        {isVideoCall && (
          <button
            onClick={handleToggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl cursor-pointer border ${
              isCameraOff 
                ? "bg-red-500 text-white border-red-400" 
                : "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
            }`}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? <VideoOff className="w-5.5 h-5.5" /> : <Video className="w-5.5 h-5.5" />}
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl shadow-red-900/60 transition-all active:scale-95 cursor-pointer border border-red-400/30"
          title="End Call"
        >
          <PhoneOff className="w-6.5 h-6.5 fill-white" />
        </button>

      </div>

    </div>
  );
}
