import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, ArrowLeft, Volume2, ShieldCheck } from "lucide-react";

export default function InterviewRoom({ appId, channelName, token, uid, onLeave }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micMuted, setMicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [isJoiningChannel, setIsJoiningChannel] = useState(false);

  const previewVideoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const clientRef = useRef(null);

  // Initialize Camera and Microphone Pre-Join Preview
  useEffect(() => {
    let active = true;

    const initMediaTracks = async () => {
      try {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (!active) {
          audioTrack.close();
          videoTrack.close();
          return;
        }
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
      } catch (err) {
        console.error("Camera/Microphone permission error:", err);
      }
    };

    initMediaTracks();

    return () => {
      active = false;
    };
  }, []);

  // Play pre-join preview
  useEffect(() => {
    if (!hasJoined && localVideoTrack && previewVideoRef.current) {
      localVideoTrack.play(previewVideoRef.current);
    }
  }, [localVideoTrack, hasJoined]);

  // Play PIP video when joined
  useEffect(() => {
    if (hasJoined && localVideoTrack && pipVideoRef.current && !videoMuted) {
      localVideoTrack.play(pipVideoRef.current);
    }
  }, [hasJoined, localVideoTrack, videoMuted]);

  // Join Channel Action
  const handleJoinCall = async () => {
    if (!channelName) return;
    setIsJoiningChannel(true);

    const validAppId = (appId && appId !== "MOCK_AGORA_APP_ID") 
      ? appId 
      : (import.meta.env.VITE_AGORA_APP_ID || "af89ac0f87f4412ea75f23aba4717e04");

    const validToken = (token && !token.startsWith("mock_")) ? token : null;

    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          setRemoteUsers((prev) => {
            if (prev.find((u) => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        }
      });

      client.on("user-left", (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      const parsedUid = Number(uid) || 2;
      await client.join(validAppId, channelName, validToken, parsedUid);

      if (localAudioTrack && localVideoTrack) {
        await client.publish([localAudioTrack, localVideoTrack]);
      }

      setIsJoiningChannel(false);
      setHasJoined(true);
    } catch (err) {
      console.warn("Agora RTC network join error, entering local session mode:", err);
      setIsJoiningChannel(false);
      setHasJoined(true);
    }
  };

  const handleToggleMic = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(micMuted);
      setMicMuted(!micMuted);
    }
  };

  const handleToggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(videoMuted);
      setVideoMuted(!videoMuted);
    }
  };

  const handleEndCall = async () => {
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (clientRef.current) {
      await clientRef.current.leave();
    }
    onLeave();
  };

  // ==========================================
  // PRE-JOIN SCREEN (Astrologer Lobby)
  // ==========================================
  if (!hasJoined) {
    return (
      <div className="fixed inset-0 bg-[#0B0F17] flex flex-col items-center justify-center p-4 md:p-8 z-50 text-white font-sans overflow-y-auto">
        {/* Top bar */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onLeave} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={18} />
              <span className="text-xs font-bold text-slate-300">Astrologer Interview Lobby</span>
            </div>
          </div>
        </div>

        {/* Center Lobby Box */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-8 items-center mt-12 md:mt-0">
          {/* Camera & Mic Preview Box */}
          <div className="md:col-span-3 flex flex-col items-center">
            <div className="relative w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center">
              <div ref={previewVideoRef} className="absolute inset-0 w-full h-full object-cover" />
              
              {videoMuted && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-10">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                    <VideoOff size={28} />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Camera is off</span>
                </div>
              )}

              {/* Bottom Preview Controls */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-3 z-20">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                    micMuted ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-slate-950/80 backdrop-blur-md text-white hover:bg-slate-900 border border-slate-700/60"
                  }`}
                  title={micMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                    videoMuted ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-slate-950/80 backdrop-blur-md text-white hover:bg-slate-900 border border-slate-700/60"
                  }`}
                  title={videoMuted ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {videoMuted ? <VideoOff size={18} /> : <Video size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 font-medium">
              <Volume2 size={14} className={micMuted ? "text-rose-400" : "text-emerald-400"} />
              <span>{micMuted ? "Microphone is muted" : "Microphone is active"}</span>
            </div>
          </div>

          {/* Join Action Box */}
          <div className="md:col-span-2 flex flex-col items-start space-y-5">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Ready to join?</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Check your camera and microphone preview before joining the interviewer.</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 w-full space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#ff7448]">Interview Channel</div>
              <div className="text-xs font-bold text-slate-200 truncate">{channelName}</div>
            </div>

            <div className="w-full space-y-3 pt-2">
              <button
                type="button"
                disabled={isJoiningChannel}
                onClick={handleJoinCall}
                className="w-full py-3.5 bg-[#ff7448] hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-orange-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isJoiningChannel ? (
                  <span>Connecting...</span>
                ) : (
                  <span>Join Room</span>
                )}
              </button>
              <button
                type="button"
                onClick={onLeave}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE MEETING ROOM (Google Meet Layout)
  // ==========================================
  return (
    <div className="fixed inset-0 bg-[#0B0F17] flex flex-col z-50 text-white font-sans overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900/90 px-6 py-3.5 flex items-center justify-between border-b border-slate-800 flex-shrink-0 z-30">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#ff7448] block">Live Astrologer Interview</span>
          <span className="text-xs font-bold block text-slate-200">Room: {channelName}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-700">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{remoteUsers.length + 1} Active</span>
        </div>
      </div>

      {/* Main Full View Container */}
      <div className="flex-1 relative w-full h-full bg-[#070A0F] p-4 flex items-center justify-center overflow-hidden">
        
        {/* MAIN VIEW: Remote Participant (Admin / Interviewer) */}
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 flex items-center justify-center">
          {remoteUsers.length > 0 ? (
            remoteUsers.map((user) => (
              <RemoteVideoPlayer key={user.uid} user={user} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 select-none">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-4 animate-pulse">
                <Users size={28} className="text-[#ff7448]" />
              </div>
              <h4 className="font-extrabold text-slate-200 text-base">Waiting for Interviewer to join...</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed font-medium">
                The admin interviewer will appear here in full screen as soon as they connect.
              </p>
            </div>
          )}

          {remoteUsers.length > 0 && (
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 text-[11px] font-extrabold flex items-center gap-2 z-20">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
              <span>Interviewer (Admin)</span>
            </div>
          )}
        </div>

        {/* FLOATING PIP BOX: Local Video (Astrologer Self-View) */}
        <div className="absolute bottom-6 right-6 w-48 sm:w-56 md:w-64 aspect-video rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-900 shadow-2xl z-30 transition-all hover:scale-105">
          <div ref={pipVideoRef} className="w-full h-full object-cover" />

          {videoMuted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-1">
                <VideoOff size={18} />
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Camera off</span>
            </div>
          )}

          <div className="absolute bottom-2 left-2.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-bold flex items-center gap-1.5 z-20">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span>You (Astrologer)</span>
          </div>
        </div>

        {/* Google Meet Floating Rounded Control Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-40 transition-all hover:border-slate-700">
          <button
            type="button"
            onClick={handleToggleMic}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-md ${
              micMuted 
                ? "bg-rose-500 border-rose-600 text-white hover:bg-rose-600" 
                : "bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-750 hover:border-slate-600"
            }`}
            title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {micMuted ? <MicOff size={19} /> : <Mic size={19} />}
          </button>

          <button
            type="button"
            onClick={handleToggleVideo}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-md ${
              videoMuted 
                ? "bg-rose-500 border-rose-600 text-white hover:bg-rose-600" 
                : "bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-750 hover:border-slate-600"
            }`}
            title={videoMuted ? "Turn Camera On" : "Turn Camera Off"}
          >
            {videoMuted ? <VideoOff size={19} /> : <Video size={19} />}
          </button>

          <button
            type="button"
            onClick={handleEndCall}
            className="w-14 h-11 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-rose-600/30"
            title="End Call & Leave"
          >
            <PhoneOff size={19} />
          </button>
        </div>

      </div>
    </div>
  );
}

// Subcomponent to render Remote User Video Player
function RemoteVideoPlayer({ user }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && user.videoTrack) {
      user.videoTrack.play(containerRef.current);
    }
  }, [user]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full object-cover" />;
}
