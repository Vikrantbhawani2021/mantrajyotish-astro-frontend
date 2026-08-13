import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users } from "lucide-react";

export default function InterviewRoom({ appId, channelName, token, uid, onLeave }) {
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  const localVideoRef = useRef(null);
  const clientRef = useRef(null);

  useEffect(() => {
    // Initialize Agora Client
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    const initAgora = async () => {
      try {
        // Set up event listeners
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

        // Join the channel
        const parsedUid = Number(uid) || 0;
        await client.join(appId, channelName, token || null, parsedUid);
        setJoined(true);

        // Create local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        // Publish local tracks
        await client.publish([audioTrack, videoTrack]);

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

      } catch (err) {
        console.error("Agora Init Error:", err);
      }
    };

    initAgora();

    return () => {
      // Clean up tracks and leave channel
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, [appId, channelName, token, uid]);

  const handleToggleMic = async () => {
    if (localAudioTrack) {
      if (micMuted) {
        await localAudioTrack.setEnabled(true);
        setMicMuted(false);
      } else {
        await localAudioTrack.setEnabled(false);
        setMicMuted(true);
      }
    }
  };

  const handleToggleVideo = async () => {
    if (localVideoTrack) {
      if (videoMuted) {
        await localVideoTrack.setEnabled(true);
        setVideoMuted(false);
      } else {
        await localVideoTrack.setEnabled(false);
        setVideoMuted(true);
      }
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

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-50 text-white font-sans">
      {/* Top Header */}
      <div className="bg-slate-900/80 px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div>
          <span className="text-[12px] uppercase tracking-wider font-extrabold text-[#ff7448] block">Live Interview Room</span>
          <span className="text-[16px] font-bold block mt-0.5">Channel: {channelName}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-700">
          <Users className="w-4.5 h-4.5 text-emerald-400" />
          <span className="text-[12px] font-bold">{remoteUsers.length + 1} Active</span>
        </div>
      </div>

      {/* Video Streams Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 min-h-0 bg-slate-950">
        {/* Local Stream (Astrologer) */}
        <div className="relative bg-slate-900 rounded-[24px] overflow-hidden border border-slate-800 flex items-center justify-center">
          <div ref={localVideoRef} className="absolute inset-0 w-full h-full object-cover" />
          
          {videoMuted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400 mb-2">
                <VideoOff className="w-7 h-7" />
              </div>
              <span className="text-slate-400 text-xs font-bold">Your camera is off</span>
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[12px] font-extrabold flex items-center gap-1.5 z-20">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>You (Astrologer)</span>
          </div>
        </div>

        {/* Remote Stream (Interviewer/Admin) */}
        <div className="relative bg-slate-900 rounded-[24px] overflow-hidden border border-slate-800 flex items-center justify-center">
          {remoteUsers.length > 0 ? (
            remoteUsers.map((user) => (
              <RemoteVideoPlayer key={user.uid} user={user} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 border border-slate-700">
                <Users className="w-7 h-7 animate-pulse text-[#ff7448]" />
              </div>
              <h4 className="font-bold text-slate-350 text-[15px]">Waiting for Interviewer</h4>
              <p className="text-[12px] text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                The admin will join this room shortly. Please keep your video and audio turned on.
              </p>
            </div>
          )}
          
          {remoteUsers.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[12px] font-extrabold flex items-center gap-1.5 z-20">
              <span className="w-2.5 h-2.5 bg-[#ff7448] rounded-full" />
              <span>Interviewer (Admin)</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="bg-slate-900 px-6 py-5 flex justify-center items-center gap-4 border-t border-slate-800 flex-shrink-0">
        <button
          onClick={handleToggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            micMuted 
              ? "bg-rose-500/10 border-rose-500 text-rose-500 hover:bg-rose-500/20" 
              : "bg-slate-800 border-slate-700 text-white hover:bg-slate-750"
          }`}
        >
          {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={handleToggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            videoMuted 
              ? "bg-rose-500/10 border-rose-500 text-rose-500 hover:bg-rose-500/20" 
              : "bg-slate-800 border-slate-700 text-white hover:bg-slate-750"
          }`}
        >
          {videoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={handleEndCall}
          className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-rose-600/30"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
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
