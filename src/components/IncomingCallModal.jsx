import { useState, useEffect } from "react";
import { Check, X, Clock, Calendar, MapPin, User, Sparkles, Phone, Video, Mic } from "lucide-react";
import { acceptCallApi, rejectCallApi } from "../config/api";
import { acceptCallRequest, rejectCallRequest } from "../services/socket";

export default function IncomingCallModal({ request, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);

  const callId = request?.callId || request?.sessionId || request?._id || request?.id || "";
  const user = request?.user || {};
  const perMinuteRate = Number(request?.perMinuteRate || request?.rate || 30) || 30;
  const callType = (request?.callType || "AUDIO").toUpperCase();
  const isVideo = callType === "VIDEO";

  useEffect(() => {
    if (timeLeft <= 0) {
      handleDecline();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (callId) {
        acceptCallRequest(callId, callType);
      }
      const res = await acceptCallApi(callId, request);
      const agoraData = res?.data?.agora || res?.agora || {};
      const sessionData = res?.data?.session || res?.session || {};

      const merged = {
        ...request,
        ...sessionData,
        agora: agoraData,
        rtcToken: agoraData.token || request.rtcToken || "",
        appId: agoraData.appId || request.appId || "",
        channelName: agoraData.channelName || sessionData.channelName || request.channelName || ""
      };

      onAccept(merged);
    } catch (err) {
      console.error("Error accepting call:", err);
      onAccept(request);
    } finally {
      setIsProcessing(false);
    }
  };


  const handleDecline = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (callId) {
        rejectCallRequest(callId);
      }
      await rejectCallApi(callId);
    } catch (err) {
      console.error("Error declining call:", err);
    } finally {
      setIsProcessing(false);
      onDecline(callId);
    }
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-gray-900 via-gray-900 to-[#1a111a] text-white rounded-[32px] p-6 border border-pink-500/30 shadow-[0_0_50px_rgba(236,72,153,0.3)] flex flex-col items-center relative overflow-hidden">
        
        {/* Pulsing Glowing Top Badge */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border animate-pulse ${
          isVideo 
            ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
            : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
        }`}>
          {isVideo ? <Video className="w-4 h-4 text-purple-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          <span>INCOMING {callType} CALL</span>
        </div>

        {/* User Image & Ring Timer */}
        <div className="relative mt-6 mb-4">
          <div className={`w-28 h-28 rounded-full p-1 shadow-xl flex items-center justify-center animate-bounce-short ${
            isVideo 
              ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-rose-500" 
              : "bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500"
          }`}>
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80"}
              alt={user?.name || "User"}
              className="w-full h-full rounded-full object-cover border-2 border-gray-900"
            />
          </div>

          {/* Countdown Badge */}
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-rose-500 to-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-gray-900 shadow-lg">
            {timeLeft}s
          </div>
        </div>

        {/* User Name & Rate */}
        <h2 className="text-xl font-bold text-center tracking-tight text-white">{user?.name || "User Client"}</h2>
        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-gray-300">
          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-0.5 rounded-full border border-emerald-500/30">
            ₹{perMinuteRate}/min Rate
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-pink-300 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Direct Call
          </span>
        </div>

        {/* User Details Card */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 mt-5 flex flex-col gap-2 text-xs text-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-pink-400" /> DOB:
            </span>
            <span className="font-semibold text-white">{user?.dob || "Not Specified"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-pink-400" /> TOB:
            </span>
            <span className="font-semibold text-white">{user?.tob || "Not Specified"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pink-400" /> POB:
            </span>
            <span className="font-semibold text-white truncate max-w-[170px]">{user?.pob || "Not Specified"}</span>
          </div>
          {user?.topic && (
            <div className="pt-1.5 mt-1 border-t border-white/10 flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-pink-400" /> Topic:
              </span>
              <span className="font-bold text-pink-400">{user.topic}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 py-3.5 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            <span>Decline</span>
          </button>

          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-2xl font-extrabold shadow-lg shadow-emerald-900/40 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Phone className="w-5 h-5 fill-white" />
            <span>{isProcessing ? "Connecting..." : "Accept"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
