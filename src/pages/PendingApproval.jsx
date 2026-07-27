import { useState, useEffect } from "react";
import { 
  ArrowLeft, Headphones, Hourglass, Check, Calendar, 
  Clock, Video, Phone, MessageSquare, Send, Info, 
  ShieldCheck, Copy, CheckCircle2, RefreshCw, ChevronRight, Lock
} from "lucide-react";
import { sendInterviewRequestApi, checkApprovalStatusApi } from "../config/api";

const APPROVAL_STEPS = [
  { key: "schedule", num: 1, title: "Schedule", desc: "Submit Request" },
  { key: "sent", num: 2, title: "Sent", desc: "Admin Review" },
  { key: "confirmed", num: 3, title: "Confirmed", desc: "Interview Ready" },
  { key: "reschedule", num: 4, title: "Decision", desc: "Admin Action" },
];

export default function PendingApproval({ onBackToProfile, onGoToDashboard, initialViewState, isRejected = false }) {
  // Active status view mode: "schedule" | "sent" | "confirmed" | "reschedule"
  const [viewState, setViewState] = useState(isRejected ? "reschedule" : (initialViewState || "schedule"));

  // Form states
  const [selectedDate, setSelectedDate] = useState("25 July 2026");
  const [selectedTime, setSelectedTime] = useState("11:30 AM");
  const [selectedMode, setSelectedMode] = useState("interview");
  const [message, setMessage] = useState("Hello Team,\nI am available on the above selected date and time. Please confirm.\nThank you!");
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [forceUnlockJoin, setForceUnlockJoin] = useState(false);
  const [meetingLink, setMeetingLink] = useState("https://meet.astrologer.com/interview-123");

  // Automatically check & poll backend if Admin has approved the interview status
  useEffect(() => {
    const fetchStatus = async () => {
      // Check local storage mock trigger first
      const localStatus = localStorage.getItem("admin_approval_status");
      if (localStatus === "confirmed" || localStatus === "approved") {
        setViewState("confirmed");
        return;
      }

      const result = await checkApprovalStatusApi();
      if (result) {
        const st = (result.status || result.interviewStatus || result.data?.status || "").toLowerCase();
        const isApproved = result.isApproved || result.approved || st === "confirmed" || st === "approved" || st === "accept" || st === "accepted";
        const isRescheduled = st === "reschedule" || st === "rescheduled" || st === "rejected";

        if (isApproved) {
          setViewState("confirmed");
          if (result.date || result.interviewDate || result.data?.date) setSelectedDate(result.date || result.interviewDate || result.data?.date);
          if (result.time || result.interviewTime || result.data?.time) setSelectedTime(result.time || result.interviewTime || result.data?.time);
          if (result.meetingLink || result.link || result.data?.meetingLink) setMeetingLink(result.meetingLink || result.link || result.data?.meetingLink);
        } else if (isRescheduled) {
          setViewState("reschedule");
        } else if (st === "sent" || st === "pending") {
          setViewState("sent");
        }
      }
    };

    fetchStatus();

    // Poll backend every 4 seconds to detect when Admin approves in real time
    const intervalId = setInterval(fetchStatus, 4000);
    return () => clearInterval(intervalId);
  }, []);

  // Check if current time is within 5 minutes prior to scheduled interview time
  const isJoinTimeAvailable = () => {
    if (forceUnlockJoin) return true;

    try {
      const scheduledDateTime = new Date(`${selectedDate} ${selectedTime}`);
      const now = new Date();
      const diffInMinutes = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60);

      // Unlocks if within 5 minutes before start or up to 120 minutes after start
      return diffInMinutes <= 5 && diffInMinutes >= -120;
    } catch (e) {
      return false;
    }
  };

  const isJoinable = isJoinTimeAvailable();
  // Step 3 (Confirmed) & Step 4 (Reschedule) ONLY appear in stepper when Admin accepts or rejects
  const visibleSteps = APPROVAL_STEPS.filter(step => {
    if (step.key === "confirmed") return viewState === "confirmed";
    if (step.key === "reschedule") return viewState === "reschedule";
    return true;
  });
  const activeStepIndex = visibleSteps.findIndex(s => s.key === viewState);
  const currentStepNum = (activeStepIndex >= 0 ? activeStepIndex : 0) + 1;
  const totalVisibleSteps = visibleSteps.length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendRequest = async () => {
    if (isSending) return;
    setIsSending(true);

    try {
      // Gather saved astrologer profile details
      let savedProfile = {};
      try {
        const rawData = localStorage.getItem("astrologer_profile_data") || localStorage.getItem("astrologer_profile_draft");
        if (rawData) savedProfile = JSON.parse(rawData);
      } catch (e) {
        console.error("Error reading saved profile data:", e);
      }

      const fullPayload = {
        ...savedProfile,
        adminMessage: message,
        requestMessage: message,
        selectedDate,
        selectedTime,
        selectedMode,
        timestamp: new Date().toISOString()
      };

      console.log("Sending Full Profile + Interview Request to Admin via API:", fullPayload);
      await sendInterviewRequestApi(fullPayload);
    } catch (err) {
      console.error("API call error sending request to admin:", err);
    } finally {
      setIsSending(false);
      setViewState("sent");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex items-center justify-center p-0 sm:p-4 overflow-x-hidden">
      <div className="w-full sm:max-w-[430px] h-screen sm:h-[92vh] sm:rounded-[32px] bg-[#FAF6F2] overflow-hidden flex flex-col relative shadow-2xl border border-gray-100">
        
        {/* Top Header Background with Zodiac Wheel & Title */}
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

          {/* Top Bar Navigation */}
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

          {/* Step-by-Step Approval Stepper Bar */}
          <div className="mt-4 pt-1 pb-1 relative z-10">
            <div className="relative flex items-center justify-between px-2">
              {/* Connecting Progress Line */}
              <div className="absolute left-6 right-6 top-[15px] -translate-y-1/2 h-[3px] bg-gray-200 -z-10 rounded-full">
                <div 
                  className="h-full bg-[#ff7448] transition-all duration-300 rounded-full"
                  style={{ 
                    width: `${totalVisibleSteps > 1 ? (activeStepIndex / (totalVisibleSteps - 1)) * 100 : 0}%` 
                  }}
                />
              </div>

              {visibleSteps.map((step, idx) => {
                const isCompleted = idx < activeStepIndex;
                const isActive = step.key === viewState;

                return (
                  <button
                    key={step.key}
                    onClick={() => setViewState(step.key)}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[12px] transition-all ${
                        isCompleted 
                          ? "bg-[#ff7448] text-white shadow-sm" 
                          : isActive 
                            ? "bg-[#ff7448] text-white shadow-md shadow-[#ff7448]/40 ring-4 ring-[#ff7448]/20 scale-105" 
                            : "bg-white text-gray-400 border border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </div>
                    <span 
                      className={`text-[10px] font-bold text-center leading-tight transition-colors ${
                        isActive ? "text-[#ff7448]" : isCompleted ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Main Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-20">

          {/* Current Step Tracker Pill */}
          <div className="mb-4 flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-sm">
            <span className="text-[12px] font-bold text-gray-500">
              Step <span className="text-[#ff7448] font-black">{currentStepNum}</span> of {totalVisibleSteps}
            </span>
            <span className="text-[11.5px] font-extrabold text-[#ff7448] bg-[#FFF0E6] px-3 py-1 rounded-full border border-[#ff7448]/20">
              {visibleSteps[activeStepIndex]?.desc || "Pending Approval"}
            </span>
          </div>

          {/* ============================================================ */}
          {/* STEP 1: PENDING APPROVAL & INTERVIEW SCHEDULE FORM */}
          {/* ============================================================ */}
          {viewState === "schedule" && (
            <div className="flex flex-col gap-5">
              
              {/* Hourglass Status Banner Card */}
              <div className="bg-gradient-to-b from-[#FFF5F0] to-[#FFEBE0] border border-[#ff7448]/20 rounded-[24px] p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-[#FFF0E6] border-2 border-[#ff7448]/30 flex items-center justify-center text-[#ff7448] shadow-inner mb-3">
                  <Hourglass className="w-8 h-8 animate-pulse text-[#ff7448]" />
                </div>

                <h2 className="text-[19px] font-extrabold text-gray-850 leading-snug">
                  Your Profile is Under Review
                </h2>
                <p className="text-[12.5px] text-gray-600 font-medium max-w-[280px] mt-1 leading-relaxed">
                  Thank you for submitting your details. Our team is verifying your information.
                </p>

                <div className="mt-4 bg-[#ff7448] text-white px-5 py-2 rounded-full text-[13px] font-bold shadow-md shadow-[#ff7448]/25">
                  Status: Step 1 - Pending Approval
                </div>
              </div>

              {/* Interview Schedule Card */}
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-gray-100/60 flex flex-col gap-5">
                
                {/* Card Title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-[#ff7448] border border-[#ff7448]/20 flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[16.5px] font-bold text-gray-800 leading-tight">Interview Request</h3>
                    <p className="text-[11.5px] text-gray-400 font-medium mt-0.5">Submit request to admin for interview slot</p>
                  </div>
                </div>

                {/* Preferred Interview Mode */}
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-gray-700">Interview Mode</label>
                  <div className="bg-[#FFF6F0] border border-[#ff7448] rounded-[16px] p-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0099FF] text-white flex items-center justify-center shadow-md shadow-[#0099FF]/20">
                        <Video className="w-5.5 h-5.5" />
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

                {/* Message to Admin (Optional) */}
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
                      isSending ? "bg-[#ff7448]/75 cursor-not-allowed opacity-90" : "bg-[#ff7448] hover:bg-[#e05e35] active:scale-98"
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
                    className="w-full bg-white border border-gray-300 text-gray-700 rounded-[16px] h-[50px] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-98 transition-all cursor-pointer shadow-sm"
                  >
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>View My Profile Details</span>
                  </button>
                </div>

                {/* Footer security note */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-semibold pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                  <span>You will receive a notification once admin responds.</span>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: REQUEST SENT SUCCESSFULLY! */}
          {/* ============================================================ */}
          {viewState === "sent" && (
            <div className="flex flex-col gap-5">
              <div className="bg-[#F2FDF5] border border-emerald-200 rounded-[24px] p-6 flex flex-col items-center text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md mb-3">
                  <Check className="w-9 h-9 stroke-[3]" />
                </div>

                <h2 className="text-[20px] font-extrabold text-emerald-900 leading-snug">
                  Step 2: Request Sent to Admin!
                </h2>
                <p className="text-[12.5px] text-emerald-700 font-medium max-w-[280px] mt-1.5 leading-relaxed">
                  Your interview request has been sent to admin. We will notify you once they confirm your schedule.
                </p>
              </div>

              {/* Requested Summary Card */}
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center gap-2.5 text-gray-800 font-bold text-[15px] border-b border-gray-100 pb-3">
                  <Calendar className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Submitted Request Summary</span>
                </div>

                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-gray-400 font-medium">Status</span>
                  <span className="text-emerald-600 font-bold">Admin Reviewing</span>
                </div>

                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-gray-400 font-medium">Mode</span>
                  <span className="text-[#0099FF] font-extrabold">Interview</span>
                </div>

                <div className="bg-blue-50/70 border border-blue-100 rounded-[14px] p-3.5 flex items-center gap-2.5 text-blue-800 text-[12px] font-medium mt-1">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Admin is reviewing your profile and slot request.</span>
                </div>

                {/* Step Progression / Demo Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="bg-[#FFF8F5] border border-[#ff7448]/20 rounded-xl p-3 flex items-center gap-2 text-[11.5px] font-semibold text-gray-700">
                    <Hourglass className="w-4 h-4 text-[#ff7448] animate-pulse flex-shrink-0" />
                    <span>Waiting for Admin Approval. This screen will update automatically once Admin accepts.</span>
                  </div>

                  <button 
                    onClick={() => {
                      localStorage.setItem("admin_approval_status", "confirmed");
                      setViewState("confirmed");
                    }}
                    className="w-full bg-white/80 border border-blue-200 text-blue-800 rounded-[14px] py-2 text-[11px] font-bold hover:bg-white active:scale-98 transition-all cursor-pointer mt-1"
                  >
                    ⚡ Demo: Admin Accepts Request (Simulate Admin Approval)
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: INTERVIEW CONFIRMED BY ADMIN */}
          {/* ============================================================ */}
          {viewState === "confirmed" && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#EFF6FF] border border-blue-200 rounded-[24px] p-5 shadow-sm flex flex-col gap-4">
                
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#0099FF] text-white flex items-center justify-center shadow-md shadow-[#0099FF]/20">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-extrabold text-blue-950 leading-tight">Interview Confirmed by Admin</h3>
                    <p className="text-[12px] text-blue-700 font-semibold mt-0.5">Your interview has been approved & scheduled.</p>
                  </div>
                </div>

                {/* Details Container */}
                <div className="bg-white rounded-[18px] p-4 flex flex-col gap-3.5 border border-blue-100 text-[13px]">
                  
                  {/* Date Field */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Date</span>
                    <span className="text-gray-900 font-bold">{selectedDate}</span>
                  </div>

                  {/* Time Field */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Time</span>
                    <span className="text-gray-900 font-bold">{selectedTime}</span>
                  </div>

                  {/* Mode Field */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Mode</span>
                    <span className="text-[#0099FF] font-extrabold">Online Video Interview</span>
                  </div>

                  {/* Meeting Link Field */}
                  <div className="flex flex-col gap-1.5 pt-2.5 border-t border-gray-100">
                    <span className="text-gray-500 font-bold text-[12px]">Meeting Link</span>
                    <div className="flex items-center justify-between bg-blue-50/60 rounded-xl px-3 py-2.5 border border-blue-150">
                      <span className="text-[#0099FF] font-bold text-[12px] truncate mr-2">{meetingLink}</span>
                      <button 
                        onClick={handleCopyLink} 
                        title="Copy Link"
                        className="text-gray-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-white transition-all cursor-pointer flex-shrink-0"
                      >
                        {copied ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" /> : <Copy className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Note Field */}
                  <div className="bg-[#FFF8F5] border border-[#ff7448]/20 rounded-xl p-3 flex items-start gap-2.5 mt-1">
                    <Info className="w-4 h-4 text-[#ff7448] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[12px] font-bold text-gray-800 block">Note</span>
                      <p className="text-[11.5px] text-gray-600 font-medium leading-relaxed mt-0.5">
                        Please ensure a stable internet connection and quiet environment. The <strong>"Join Interview"</strong> button will automatically unlock <strong>5 minutes prior</strong> to your scheduled interview ({selectedTime}).
                      </p>
                    </div>
                  </div>

                </div>

                {/* Join Button (Unlocks 5 Mins Prior) */}
                <div className="flex flex-col gap-2 mt-1">
                  {isJoinable ? (
                    <button 
                      onClick={() => window.open(meetingLink, "_blank")}
                      className="w-full bg-[#0099FF] hover:bg-blue-600 text-white rounded-[16px] h-[50px] font-extrabold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#0099FF]/25 animate-pulse text-[14.5px]"
                    >
                      <Video className="w-5 h-5" />
                      <span>Join Live Interview Now</span>
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full bg-gray-200 text-gray-500 rounded-[16px] h-[50px] font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-90 text-[13.5px] border border-gray-300 shadow-inner"
                    >
                      <Lock className="w-4 h-4 text-gray-400" />
                      <span>Join Interview (Unlocks 5 Mins Prior)</span>
                    </button>
                  )}

                  {!isJoinable && (
                    <p className="text-center text-[11px] font-bold text-blue-700/80 mt-0.5">
                      🔒 Button unlocks 5 minutes before scheduled interview ({selectedTime})
                    </p>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: ADMIN REJECTED & RESCHEDULE REQUESTED */}
          {/* ============================================================ */}
          {viewState === "reschedule" && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#FFFBEB] border border-amber-200 rounded-[24px] p-5 shadow-sm flex flex-col gap-4">
                
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-extrabold text-amber-950 leading-tight">Step 4: Admin Decision</h3>
                    <p className="text-[12px] text-amber-700 font-semibold mt-0.5">Admin rejected slot & suggested a new time.</p>
                  </div>
                </div>

                <div className="bg-white rounded-[18px] p-4 flex flex-col gap-3 border border-amber-100 text-[13px]">
                  <span className="text-[12px] font-bold text-gray-800 border-b border-gray-100 pb-2">Admin Suggested Time</span>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Date</span>
                    <span className="text-gray-900 font-bold">26 July 2026</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Time</span>
                    <span className="text-gray-900 font-bold">03:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Mode</span>
                    <span className="text-[#0099FF] font-extrabold">Interview</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-1">
                  <button 
                    onClick={() => setViewState("schedule")}
                    className="bg-white border border-[#ff7448] text-[#ff7448] rounded-[16px] h-[48px] font-bold text-[12.5px] hover:bg-[#FFF0E6]/50 active:scale-98 transition-all cursor-pointer"
                  >
                    Choose Another Time
                  </button>

                  <button 
                    onClick={() => setViewState("confirmed")}
                    className="bg-[#ff7448] text-white rounded-[16px] h-[48px] font-bold text-[12.5px] flex items-center justify-center gap-1.5 hover:bg-[#e05e35] active:scale-98 transition-all cursor-pointer shadow-md shadow-[#ff7448]/20"
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
    </div>
  );
}
