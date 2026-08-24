import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Headphones, Hourglass, Check, Calendar, 
  Clock, Video, MessageSquare, Send, Info, 
  ShieldCheck, Copy, CheckCircle2, RefreshCw, Lock,
  Bell, Star, Zap, AlertTriangle
} from "lucide-react";
import { sendInterviewRequestApi, checkApprovalStatusApi } from "../config/api";
import InterviewRoom from "./InterviewRoom";

const APPROVAL_STEPS = [
  { key: "schedule", num: 1, title: "Schedule", desc: "Submit Request" },
  { key: "sent", num: 2, title: "Sent", desc: "Admin Review" },
  { key: "confirmed", num: 3, title: "Confirmed", desc: "Interview Ready" },
  { key: "reschedule", num: 4, title: "Decision", desc: "Admin Action" },
];

// ─── Persistent State Helpers ───────────────────────────────────────────
const LS_KEY_VIEW   = "astro_interview_view_state";
const LS_KEY_SENT   = "interview_request_sent";
const LS_KEY_DATE   = "astro_interview_date";
const LS_KEY_TIME   = "astro_interview_time";
const LS_KEY_LINK   = "astro_meeting_link";
const LS_KEY_RAW_DATE = "astro_interview_raw_date";

function getSavedViewState(isRejected, initialViewState) {
  if (isRejected) return "reschedule";
  if (initialViewState) return initialViewState;
  // Check localStorage for persisted state
  const saved = localStorage.getItem(LS_KEY_VIEW);
  if (saved && ["schedule","sent","confirmed","reschedule"].includes(saved)) return saved;
  // If they already sent a request (flag), show sent
  if (localStorage.getItem(LS_KEY_SENT) === "true") return "sent";
  return "schedule";
}

export default function PendingApproval({ onBackToProfile, onGoToDashboard, initialViewState, isRejected = false }) {
  const [viewState, setViewState] = useState(() => getSavedViewState(isRejected, initialViewState));
  const navigate = useNavigate();

  // Redirect to login if token is missing (same browser login verification)
  useEffect(() => {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Form states
  const [selectedDate, setSelectedDate] = useState(localStorage.getItem(LS_KEY_DATE) || "");
  const [selectedTime, setSelectedTime] = useState(localStorage.getItem(LS_KEY_TIME) || "");

  // Preferred Availability Slots (Astrologer fills 1 or 2 options for Admin)
  const [preferredDate1, setPreferredDate1] = useState("");
  const [preferredTime1, setPreferredTime1] = useState("");
  const [preferredDate2, setPreferredDate2] = useState("");
  const [preferredTime2, setPreferredTime2] = useState("");

  const [selectedMode, setSelectedMode] = useState("interview");
  const [message, setMessage] = useState("Hello Team,\nI am available on the above selected date and time. Please confirm.\nThank you!");
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [forceUnlockJoin, setForceUnlockJoin] = useState(false);
  const [rawInterviewDate, setRawInterviewDate] = useState(localStorage.getItem(LS_KEY_RAW_DATE) || null);
  const [meetingLink, setMeetingLink] = useState(localStorage.getItem(LS_KEY_LINK) || "");

  // Agora states
  const [inVideoCall, setInVideoCall] = useState(false);
  const [agoraAppId, setAgoraAppId] = useState("MOCK_AGORA_APP_ID");
  const [agoraChannel, setAgoraChannel] = useState("");
  const [agoraToken, setAgoraToken] = useState("");
  const [agoraUid, setAgoraUid] = useState(2);

  // Persist viewState to localStorage whenever it changes
  const updateViewState = useCallback((newState) => {
    setViewState(newState);
    localStorage.setItem(LS_KEY_VIEW, newState);
  }, []);

  // ─── Background polling: check approval status every 4 seconds ─────────
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const result = await checkApprovalStatusApi();
        if (!result) return;

        // Normalize: backend returns top-level fields (not nested .data)
        const astrologerStatus = String(
          result.status || result.data?.status || ""
        ).toLowerCase();
        
        const interviewStatus = String(
          result.interviewStatus || result.data?.interviewStatus || ""
        ).toLowerCase();

        // ── 1. Fully approved → go to dashboard ──────────────────────────
        if (
          astrologerStatus === "approved" ||
          result.isApproved === true ||
          result.data?.isApproved === true
        ) {
          // Persist approval in localStorage so ProtectedRoute allows dashboard
          try {
            const rawUser = localStorage.getItem("astrologerUser");
            if (rawUser) {
              const uObj = JSON.parse(rawUser);
              uObj.status = "approved";
              localStorage.setItem("astrologerUser", JSON.stringify(uObj));
            }
          } catch (e) {}
          // Clear interview flow flags
          localStorage.removeItem(LS_KEY_VIEW);
          localStorage.removeItem(LS_KEY_SENT);
          localStorage.removeItem(LS_KEY_DATE);
          localStorage.removeItem(LS_KEY_TIME);
          localStorage.removeItem(LS_KEY_LINK);
          localStorage.removeItem(LS_KEY_RAW_DATE);
          onGoToDashboard();
          return;
        }

        // ── 2. Interview confirmed / scheduled by admin ───────────────────
        const isConfirmed =
          interviewStatus === "scheduled" ||
          interviewStatus === "confirmed" ||
          interviewStatus === "passed";

        if (isConfirmed) {
          // Extract date / time / link
          const dateRaw = result.interviewDate || result.data?.interviewDate;
          const dateStr  = result.date || result.data?.date;
          const timeStr  = result.time || result.data?.time;
          const link     = result.meetingLink || result.link || result.data?.meetingLink || result.data?.link;

          if (dateRaw) {
            setRawInterviewDate(dateRaw);
            localStorage.setItem(LS_KEY_RAW_DATE, dateRaw);
            const d = new Date(dateRaw);
            const fDate = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
            const fTime = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            setSelectedDate(fDate);
            setSelectedTime(fTime);
            localStorage.setItem(LS_KEY_DATE, fDate);
            localStorage.setItem(LS_KEY_TIME, fTime);
          } else {
            if (dateStr) {
              setSelectedDate(dateStr);
              localStorage.setItem(LS_KEY_DATE, dateStr);
            }
            if (timeStr) {
              setSelectedTime(timeStr);
              localStorage.setItem(LS_KEY_TIME, timeStr);
            }
          }

          if (link) {
            setMeetingLink(link);
            localStorage.setItem(LS_KEY_LINK, link);
          }

          // Agora fields
          if (result.agoraAppId    || result.data?.agoraAppId)    setAgoraAppId(result.agoraAppId    || result.data?.agoraAppId);
          if (result.agoraChannel  || result.data?.agoraChannel)  setAgoraChannel(result.agoraChannel  || result.data?.agoraChannel);
          if (result.agoraToken    || result.data?.agoraToken)    setAgoraToken(result.agoraToken    || result.data?.agoraToken);
          if (result.agoraUid      || result.data?.agoraUid)      setAgoraUid(result.agoraUid        || result.data?.agoraUid);

          updateViewState("confirmed");
          return;
        }

        // ── 3. Interview rejected / rescheduled ──────────────────────────
        const isRescheduled =
          interviewStatus === "reschedule" ||
          interviewStatus === "rescheduled" ||
          interviewStatus === "rejected" ||
          interviewStatus === "failed";

        if (isRescheduled) {
          updateViewState("reschedule");
          return;
        }

        // ── 4. Request sent, waiting for admin ───────────────────────────
        const isSent =
          interviewStatus === "requested" ||
          interviewStatus === "pending" ||
          interviewStatus === "sent";

        if (isSent) {
          updateViewState("sent");
          return;
        }

        // ── 5. No interview record yet → show schedule form ───────────────
        if (!localStorage.getItem(LS_KEY_SENT)) {
          updateViewState("schedule");
        }

      } catch (err) {
        console.error("Error fetching approval status:", err);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 4000);
    return () => clearInterval(intervalId);
  }, [onGoToDashboard, updateViewState]);

  // ─── Join time check ─────────────────────────────────────────────────
  const isJoinTimeAvailable = () => {
    if (forceUnlockJoin) return true;
    try {
      const targetDate = rawInterviewDate
        ? new Date(rawInterviewDate)
        : selectedDate && selectedTime
          ? new Date(`${selectedDate} ${selectedTime}`)
          : null;
      if (!targetDate || isNaN(targetDate.getTime())) return false;
      const now = new Date();
      const diffMins = (targetDate.getTime() - now.getTime()) / (1000 * 60);
      return diffMins <= 15 && diffMins >= -120;
    } catch (e) {
      return false;
    }
  };

  const isJoinable = isJoinTimeAvailable();

  // Auto-join if '?join=true' or '?autojoin=true' is in the URL and the meeting is active
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("join") === "true" || params.get("autojoin") === "true") {
      if (isJoinable && !inVideoCall && agoraChannel && agoraToken) {
        setInVideoCall(true);
      }
    }
  }, [isJoinable, inVideoCall, agoraChannel, agoraToken]);

  const visibleSteps = APPROVAL_STEPS.filter(step => {
    if (step.key === "confirmed")  return viewState === "confirmed";
    if (step.key === "reschedule") return viewState === "reschedule";
    return true;
  });
  const activeStepIndex  = visibleSteps.findIndex(s => s.key === viewState);
  const currentStepNum   = (activeStepIndex >= 0 ? activeStepIndex : 0) + 1;
  const totalVisibleSteps = visibleSteps.length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Send Interview Request ───────────────────────────────────────────
  const handleSendRequest = async () => {
    if (isSending) return;
    setIsSending(true);

    try {
      let savedProfile = {};
      try {
        const rawData = localStorage.getItem("astrologer_profile_data") || localStorage.getItem("astrologer_profile_draft");
        if (rawData) savedProfile = JSON.parse(rawData);
      } catch (e) {}

      const preferredSlots = [
        ...(preferredDate1 && preferredTime1 ? [{ date: preferredDate1, time: preferredTime1 }] : []),
        ...(preferredDate2 && preferredTime2 ? [{ date: preferredDate2, time: preferredTime2 }] : [])
      ];

      const fullPayload = {
        ...savedProfile,
        preferredSlots,
        adminMessage: message,
        requestMessage: message,
        selectedDate: preferredDate1,
        selectedTime: preferredTime1,
        selectedMode,
        timestamp: new Date().toISOString()
      };

      console.log("Sending Full Profile + Interview Request to Admin:", fullPayload);
      await sendInterviewRequestApi(fullPayload);

      // ✅ Persist the "sent" state so page refresh keeps Step 2
      localStorage.setItem(LS_KEY_SENT, "true");
      localStorage.setItem(LS_KEY_VIEW, "sent");

    } catch (err) {
      console.error("API call error sending request to admin:", err);
      // Even on error, mark as sent (optimistic) if we attempted
      localStorage.setItem(LS_KEY_SENT, "true");
      localStorage.setItem(LS_KEY_VIEW, "sent");
    } finally {
      setIsSending(false);
      updateViewState("sent");
    }
  };

  // ─── Reschedule (re-submit request) ──────────────────────────────────
  const handleReschedule = () => {
    localStorage.removeItem(LS_KEY_SENT);
    localStorage.setItem(LS_KEY_VIEW, "schedule");
    setViewState("schedule");
  };

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex items-center justify-center p-0 sm:p-4 overflow-x-hidden">
      <div className="w-full md:max-w-[700px] h-screen sm:h-[90vh] sm:rounded-[32px] bg-[#FAF6F2] overflow-hidden flex flex-col relative shadow-2xl border border-gray-100">
        
        {/* ── Top Header ──────────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-b from-[#FFF0E6] to-[#FAF6F2] pt-5 pb-3 px-5 flex-shrink-0 border-b border-gray-100/40">
          
          {/* Zodiac Background Graphic */}
          <div className="absolute right-0 top-0 w-40 h-40 opacity-20 pointer-events-none overflow-hidden select-none">
            <svg className="w-full h-full text-[#ff7448] animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8">
              <circle cx="50" cy="50" r="45" />
              <circle cx="50" cy="50" r="40" />
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={50 + Math.cos(angle) * 40}
                    y1={50 + Math.sin(angle) * 40}
                    x2={50 + Math.cos(angle) * 45}
                    y2={50 + Math.sin(angle) * 45}
                  />
                );
              })}
            </svg>
          </div>

          {/* Nav bar */}
          <div className="relative z-10 flex items-center justify-between">
            <button
              onClick={onBackToProfile}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 hover:bg-white active:scale-95 transition-all cursor-pointer shadow-sm text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className="text-[18px] font-bold text-gray-800 tracking-wide text-center flex-1 mx-2">
              Pending Approval Status
            </h1>

            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 hover:bg-white active:scale-95 transition-all cursor-pointer shadow-sm text-gray-700">
              <Headphones className="w-5 h-5 text-[#ff7448]" />
            </button>
          </div>

          {/* ── Step Stepper ───────────────────────────────────────────────── */}
          <div className="mt-4 pt-1 pb-1 relative z-10">
            <div className="relative flex items-center justify-between px-2">
              {/* Progress line */}
              <div className="absolute left-6 right-6 top-[15px] -translate-y-1/2 h-[3px] bg-gray-200 -z-10 rounded-full">
                <div
                  className="h-full bg-[#ff7448] transition-all duration-500 rounded-full"
                  style={{ width: `${totalVisibleSteps > 1 ? (activeStepIndex / (totalVisibleSteps - 1)) * 100 : 0}%` }}
                />
              </div>

              {visibleSteps.map((step, idx) => {
                const isCompleted = idx < activeStepIndex;
                const isActive    = step.key === viewState;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[12px] transition-all ${
                      isCompleted
                        ? "bg-[#ff7448] text-white shadow-sm"
                        : isActive
                          ? "bg-[#ff7448] text-white shadow-md shadow-[#ff7448]/40 ring-4 ring-[#ff7448]/20 scale-105"
                          : "bg-white text-gray-400 border border-gray-300"
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] font-bold text-center leading-tight transition-colors ${
                      isActive ? "text-[#ff7448]" : isCompleted ? "text-gray-700" : "text-gray-400"
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Scrollable Content ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-20">

          {/* Step tracker pill */}
          <div className="mb-4 flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-sm">
            <span className="text-[12px] font-bold text-gray-500">
              Step <span className="text-[#ff7448] font-black">{currentStepNum}</span> of {totalVisibleSteps}
            </span>
            <span className="text-[11.5px] font-extrabold text-[#ff7448] bg-[#FFF0E6] px-3 py-1 rounded-full border border-[#ff7448]/20">
              {visibleSteps[activeStepIndex]?.desc || "Pending Approval"}
            </span>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              STEP 1: SCHEDULE – Send Request to Admin
          ══════════════════════════════════════════════════════════════ */}
          {viewState === "schedule" && (
            <div className="flex flex-col gap-5">

              {/* Status Banner */}
              <div className="bg-gradient-to-b from-[#FFF5F0] to-[#FFEBE0] border border-[#ff7448]/20 rounded-[24px] p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-[#FFF0E6] border-2 border-[#ff7448]/30 flex items-center justify-center text-[#ff7448] shadow-inner mb-3">
                  <Hourglass className="w-8 h-8 animate-pulse text-[#ff7448]" />
                </div>
                <h2 className="text-[19px] font-extrabold text-gray-850 leading-snug">Your Profile is Under Review</h2>
                <p className="text-[12.5px] text-gray-600 font-medium max-w-[280px] mt-1 leading-relaxed">
                  Thank you for submitting your details. Our team is verifying your information.
                </p>
                <div className="mt-4 bg-[#ff7448] text-white px-5 py-2 rounded-full text-[13px] font-bold shadow-md shadow-[#ff7448]/25">
                  Status: Step 1 – Pending Approval
                </div>
              </div>

              {/* Interview Request Card */}
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-gray-100/60 flex flex-col gap-5">

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-[#ff7448] border border-[#ff7448]/20 flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[16.5px] font-bold text-gray-800 leading-tight">Interview Request</h3>
                    <p className="text-[11.5px] text-gray-400 font-medium mt-0.5">Submit request to admin for interview slot</p>
                  </div>
                </div>

                {/* Preferred Availability Slots (Astrologer selects 1 or 2 options) */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-extrabold text-gray-800">Your Preferred Interview Time Slots</label>
                    <span className="text-[10.5px] font-bold text-[#ff7448]">Select 1 or 2 slots</span>
                  </div>

                  {/* Slot 1 */}
                  <div className="bg-gray-50/90 border border-gray-200/90 rounded-[16px] p-3 sm:p-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#ff7448] uppercase tracking-wider">Option 1 (Primary Slot) *</span>
                      <span className="text-[10px] font-bold text-gray-400">First Choice</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-[#ff7448] transition-all">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                        <input 
                          type="date"
                          required
                          value={preferredDate1}
                          onChange={(e) => setPreferredDate1(e.target.value)}
                          className="w-full text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-[#ff7448] transition-all">
                        <Clock className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                        <input 
                          type="time"
                          required
                          value={preferredTime1}
                          onChange={(e) => setPreferredTime1(e.target.value)}
                          className="w-full text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slot 2 (Optional) */}
                  <div className="bg-gray-50/90 border border-gray-200/90 rounded-[16px] p-3 sm:p-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Option 2 (Alternate Slot - Optional)</span>
                      <span className="text-[10px] font-bold text-gray-400">Backup Choice</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-[#ff7448] transition-all">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                        <input 
                          type="date"
                          value={preferredDate2}
                          onChange={(e) => setPreferredDate2(e.target.value)}
                          className="w-full text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-[#ff7448] transition-all">
                        <Clock className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                        <input 
                          type="time"
                          value={preferredTime2}
                          onChange={(e) => setPreferredTime2(e.target.value)}
                          className="w-full text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interview Mode */}
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-gray-700">Interview Mode</label>
                  <div className="bg-[#FFF6F0] border border-[#ff7448] rounded-[16px] p-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0099FF] text-white flex items-center justify-center shadow-md shadow-[#0099FF]/20">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[14px] font-bold text-gray-900 block leading-tight">Interview</span>
                        <span className="text-[11px] font-bold text-[#0099FF] block mt-0.5">High Quality Live Video</span>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#ff7448] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                </div>

                {/* Message to Admin */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-700">
                    Message to Admin <span className="text-gray-400 font-medium">(Optional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      rows="3"
                      maxLength="250"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-gray-50/60 border border-gray-200 rounded-[16px] p-3 pb-6 text-[12.5px] font-medium text-gray-800 focus:border-[#ff7448] focus:bg-white focus:outline-none transition-all resize-none leading-relaxed"
                    />
                    <div className="absolute bottom-2 right-3 text-[10.5px] font-bold text-gray-400">
                      {message.length}/250
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-1">
                  <button
                    onClick={handleSendRequest}
                    disabled={isSending}
                    className={`w-full text-white rounded-[16px] h-[50px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#ff7448]/20 ${
                      isSending ? "bg-[#ff7448]/75 cursor-not-allowed opacity-90" : "bg-[#ff7448] hover:bg-[#e05e35] active:scale-[0.98]"
                    }`}
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Request to Admin...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Request to Admin</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onBackToProfile}
                    className="w-full bg-white border border-gray-300 text-gray-700 rounded-[16px] h-[50px] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  >
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>View My Profile Details</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-semibold pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                  <span>You will receive a notification once admin responds.</span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 2: REQUEST SENT – Waiting for Admin
          ══════════════════════════════════════════════════════════════ */}
          {viewState === "sent" && (
            <div className="flex flex-col gap-5">

              {/* Success Banner */}
              <div className="bg-[#F2FDF5] border border-emerald-200 rounded-[24px] p-6 flex flex-col items-center text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md mb-3">
                  <Check className="w-9 h-9 stroke-[3]" />
                </div>
                <h2 className="text-[20px] font-extrabold text-emerald-900 leading-snug">
                  Step 2: Request Sent to Admin!
                </h2>
                <p className="text-[12.5px] text-emerald-700 font-medium max-w-[290px] mt-1.5 leading-relaxed">
                  Your interview request has been sent to admin. We will notify you once they confirm your schedule.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center gap-2.5 text-gray-800 font-bold text-[15px] border-b border-gray-100 pb-3">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Submitted Request Summary</span>
                </div>

                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-gray-400 font-medium">Status</span>
                  <span className="text-emerald-600 font-bold">Admin Reviewing</span>
                </div>

                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-gray-400 font-medium">Mode</span>
                  <span className="text-[#0099FF] font-extrabold">Live Video Interview</span>
                </div>

                {/* Auto-update notice */}
                <div className="bg-[#FFF8F5] border border-[#ff7448]/20 rounded-xl p-3.5 flex items-center gap-2.5 text-[11.5px] font-semibold text-gray-700">
                  <RefreshCw className="w-4 h-4 text-[#ff7448] animate-spin flex-shrink-0" />
                  <span>This page updates automatically every few seconds. You'll see the meeting details here once admin schedules your interview.</span>
                </div>

                {/* Info box */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-[14px] p-3.5 flex items-center gap-2.5 text-blue-800 text-[12px] font-medium">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Admin is reviewing your profile and will schedule a video interview shortly.</span>
                </div>
              </div>

              {/* What happens next */}
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col gap-3">
                <span className="text-[13px] font-extrabold text-gray-800">What happens next?</span>
                {[
                  { icon: Bell, color: "text-amber-500 bg-amber-50", text: "Admin reviews your profile and interview request" },
                  { icon: Calendar, color: "text-blue-500 bg-blue-50", text: "Admin schedules a video interview with date & time" },
                  { icon: Video, color: "text-emerald-500 bg-emerald-50", text: "You'll receive the meeting link here to join the interview" },
                  { icon: Star, color: "text-purple-500 bg-purple-50", text: "After passing, you'll be approved to start consultations" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[12px] font-medium text-gray-600">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 3: INTERVIEW CONFIRMED BY ADMIN
          ══════════════════════════════════════════════════════════════ */}
          {viewState === "confirmed" && (
            <div className="flex flex-col gap-4">

              {/* Confirmation Banner */}
              <div className="bg-gradient-to-b from-[#EFF6FF] to-[#DBEAFE] border border-blue-200 rounded-[24px] p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#0099FF] text-white flex items-center justify-center shadow-md shadow-[#0099FF]/20">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-extrabold text-blue-950 leading-tight">Interview Confirmed by Admin!</h3>
                    <p className="text-[12px] text-blue-700 font-semibold mt-0.5">Your interview has been approved & scheduled.</p>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-white rounded-[18px] p-4 flex flex-col gap-3.5 border border-blue-100 text-[13px]">

                  {selectedDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Date</span>
                      <span className="text-gray-900 font-bold">{selectedDate}</span>
                    </div>
                  )}

                  {selectedTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Time</span>
                      <span className="text-gray-900 font-bold">{selectedTime}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Mode</span>
                    <span className="text-[#0099FF] font-extrabold">Online Video Interview</span>
                  </div>

                  {/* Meeting Link */}
                  {meetingLink && (
                    <div className="flex flex-col gap-1.5 pt-2.5 border-t border-gray-100">
                      <span className="text-gray-500 font-bold text-[12px]">Meeting Link</span>
                      <div className="flex items-center justify-between bg-blue-50/60 rounded-xl px-3 py-2.5 border border-blue-100">
                        <span className="text-[#0099FF] font-bold text-[12px] truncate mr-2">{meetingLink}</span>
                        <button
                          onClick={handleCopyLink}
                          title="Copy Link"
                          className="text-gray-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-white transition-all cursor-pointer flex-shrink-0"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  <div className="bg-[#FFF8F5] border border-[#ff7448]/20 rounded-xl p-3 flex items-start gap-2.5 mt-1">
                    <Info className="w-4 h-4 text-[#ff7448] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[12px] font-bold text-gray-800 block">Note</span>
                      <p className="text-[11.5px] text-gray-600 font-medium leading-relaxed mt-0.5">
                        Please ensure a stable internet connection and quiet environment.
                        {selectedTime && ` The "Join Interview" button unlocks 15 minutes before your scheduled interview (${selectedTime}).`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Join Button */}
                <div className="flex flex-col gap-2">
                  {isJoinable ? (
                    <button
                      onClick={() => setInVideoCall(true)}
                      className="w-full bg-[#0099FF] hover:bg-blue-600 text-white rounded-[16px] h-[52px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-[#0099FF]/25 animate-pulse text-[14.5px]"
                    >
                      <Video className="w-5 h-5" />
                      <span>Join Live Video Interview</span>
                    </button>
                  ) : (
                    <>
                      <button
                        disabled
                        className="w-full bg-gray-200 text-gray-500 rounded-[16px] h-[52px] font-bold flex items-center justify-center gap-2 cursor-not-allowed text-[13.5px] border border-gray-300 shadow-inner"
                      >
                        <Lock className="w-4 h-4 text-gray-400" />
                        <span>Join Interview (Unlocks 15 Mins Prior)</span>
                      </button>
                      {selectedTime && (
                        <p className="text-center text-[11px] font-bold text-blue-700/80">
                          🔒 Button unlocks 15 minutes before your interview at {selectedTime}
                        </p>
                      )}
                      {/* Dev unlock (remove in production) */}
                      <button
                        onClick={() => setForceUnlockJoin(true)}
                        className="w-full bg-white border border-dashed border-gray-300 text-gray-400 rounded-[14px] py-2 text-[10px] font-bold hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        🔧 Dev: Force unlock join button
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 4: ADMIN DECISION (Reschedule / Rejected)
          ══════════════════════════════════════════════════════════════ */}
          {viewState === "reschedule" && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#FFFBEB] border border-amber-200 rounded-[24px] p-5 shadow-sm flex flex-col gap-4">

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-extrabold text-amber-950 leading-tight">Admin Requested Changes</h3>
                    <p className="text-[12px] text-amber-700 font-semibold mt-0.5">Admin rejected slot & suggested a new time.</p>
                  </div>
                </div>

                <div className="bg-white rounded-[18px] p-4 flex flex-col gap-3 border border-amber-100 text-[13px]">
                  <span className="text-[12px] font-bold text-gray-800 border-b border-gray-100 pb-2">Admin Suggested Time</span>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Date</span>
                    <span className="text-gray-900 font-bold">{selectedDate || "TBD"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Time</span>
                    <span className="text-gray-900 font-bold">{selectedTime || "TBD"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Mode</span>
                    <span className="text-[#0099FF] font-extrabold">Interview</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleReschedule}
                    className="bg-white border border-[#ff7448] text-[#ff7448] rounded-[16px] h-[48px] font-bold text-[12.5px] hover:bg-[#FFF0E6]/50 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Choose Another Time
                  </button>
                  <button
                    onClick={() => updateViewState("confirmed")}
                    className="bg-[#ff7448] text-white rounded-[16px] h-[48px] font-bold text-[12.5px] flex items-center justify-center gap-1.5 hover:bg-[#e05e35] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#ff7448]/20"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Accept Suggested Time</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium pt-1">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>Respond to admin to confirm the final interview schedule.</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Video Call Overlay */}
      {inVideoCall && (
        <InterviewRoom
          appId={agoraAppId}
          channelName={agoraChannel}
          token={agoraToken}
          uid={agoraUid}
          onLeave={() => setInVideoCall(false)}
        />
      )}
    </div>
  );
}
