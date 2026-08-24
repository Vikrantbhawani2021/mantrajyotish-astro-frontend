import { useState, useRef, useEffect, useMemo } from "react";
import { Phone, Mail, ArrowLeft, Send, ShieldCheck, ChevronDown, Lock, Eye, EyeOff, CheckCircle2, KeyRound, ShieldAlert, Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

export default function Forgot({ onNavigateToLogin }) {
  const [step, setStep] = useState(1); // 1: Identifier, 2: OTP, 3: New Password, 4: Success
  const [inputVal, setInputVal] = useState("");
  const [submittedValue, setSubmittedValue] = useState("");
  const [loadingStep1, setLoadingStep1] = useState(false);
  const [registeredPhone, setRegisteredPhone] = useState(null);
  const [step1Error, setStep1Error] = useState("");

  // Step 2 OTP states (6 digits)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Step 3 Password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Twinkling stars background once per mount
  const stars = useMemo(() => Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 1.8 + 0.8,
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 5}s`,
  })), []);

  const isNumeric = /^\d+$/.test(inputVal.trim());
  const isEmail = inputVal.includes("@");

  // Timer countdown for Resend OTP
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Send OTP API call
  const sendOtpApi = async (val) => {
    setLoadingStep1(true);
    setStep1Error("");

    const isNum = /^\d+$/.test(val.trim());
    const payload = isNum 
      ? { phone: val.trim(), mobile: val.trim(), identifier: val.trim() } 
      : { email: val.trim(), identifier: val.trim() };

    console.log("Sending OTP API payload:", payload);

    try {
      const response = await fetch(API_ENDPOINTS.SEND_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      console.log("Send OTP API response:", response.status, data);

      if (response.ok || data.success || data.status === "success") {
        setSubmittedValue(isNum ? `+91 ${val.trim()}` : val.trim());
        const phoneVal = data.data?.targetPhone || data.targetPhone;
        if (phoneVal) {
          const cleanPhone = phoneVal.replace("+91", "").trim();
          const masked = cleanPhone.length >= 10 
            ? `${cleanPhone.slice(0, 2)}******${cleanPhone.slice(-2)}` 
            : cleanPhone;
          setRegisteredPhone(`+91 ${masked}`);
        } else {
          setRegisteredPhone(null);
        }
        setStep(2);
        setTimer(30);
        setCanResend(false);
      } else {
        const msg = data.message || data.error || "Failed to send OTP.";
        setStep1Error(msg);
      }
    } catch (err) {
      console.error("Send OTP API error:", err);
      setStep1Error("Network error. Failed to send OTP.");
    } finally {
      setLoadingStep1(false);
    }
  };

  // Step 1: Send OTP handler
  const handleStep1Submit = (e) => {
    e.preventDefault();
    setStep1Error("");

    const val = inputVal.trim();
    if (!val) {
      setStep1Error("Please enter your registered mobile number or email.");
      return;
    }

    const isNum = /^\d+$/.test(val);
    if (isNum) {
      if (val.length !== 10) {
        setStep1Error("Please enter a valid 10-digit mobile number.");
        return;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setStep1Error("Please enter a valid email address.");
        return;
      }
    }

    sendOtpApi(val);
  };

  // OTP Input handlers (6 digits)
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      if (digits.length > 0) {
        const newOtp = [...otp];
        digits.forEach((d, i) => {
          if (index + i < 6) {
            newOtp[index + i] = d;
          }
        });
        setOtp(newOtp);
        setOtpError("");
        const nextIdx = Math.min(index + digits.length, 5);
        otpRefs[nextIdx].current?.focus();
      }
      return;
    }

    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setOtpError("");
      if (value && index < 5) {
        otpRefs[index + 1].current?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newOtp = ["", "", "", "", "", ""];
      pastedData.split("").forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      setOtpError("");
      const nextIdx = Math.min(pastedData.length, 5);
      otpRefs[nextIdx].current?.focus();
    }
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    sendOtpApi(inputVal);
  };

  // Combined Step 2: Reset Password (OTP + New Password) Submit Handler
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    setErrorMessage("");

    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      setOtpError("Please enter complete 6-digit OTP.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New Password and Confirm Password do not match.");
      return;
    }

    setLoading(true);

    try {
      const isNum = /^\d+$/.test(inputVal.trim());
      const payload = {
        ...(isNum ? { phone: inputVal.trim(), mobile: inputVal.trim() } : { email: inputVal.trim() }),
        identifier: inputVal.trim(),
        otp: enteredOtp,
        password: newPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      };

      console.log("Submitting Combined Reset Password API Payload:", payload);

      const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      console.log("Reset Password API Response:", response.status, data);

      if (response.ok || data.success || data.status === "success") {
        setStep(3); // Success Screen
      } else {
        const msg = data.message || data.error || "Password reset failed. Please check your OTP.";
        setErrorMessage(msg);
        setStep(3);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#060B16] flex justify-center items-center overflow-hidden">
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        @keyframes pulse-drift {
          0% {
            transform: translate(0, 0);
            opacity: 0.2;
          }
          50% {
            transform: translate(15px, -15px);
            opacity: 0.8;
          }
          100% {
            transform: translate(0, 0);
            opacity: 0.2;
          }
        }
        .animate-pulse-drift {
          animation: pulse-drift linear infinite;
        }
      `}</style>
      <div className="w-full h-full md:grid md:grid-cols-12 bg-[#070E1A] overflow-hidden relative shadow-2xl">
        
        {/* Cosmos background stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute bg-white rounded-full animate-pulse-drift pointer-events-none"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: star.delay,
                animationDuration: star.duration,
              }}
            />
          ))}
          <div className="absolute w-[350px] h-[350px] rounded-full bg-[#ff7448]/5 blur-[90px] -top-12 -left-12 pointer-events-none" />
          <div className="absolute w-[450px] h-[450px] rounded-full bg-blue-500/5 blur-[120px] bottom-10 right-0 pointer-events-none" />
        </div>

        {/* Left Side: Brand Banner (Desktop Only) */}
        <div className="hidden md:flex md:col-span-6 lg:col-span-6 bg-[#060B16]/40 flex-col justify-center items-center p-12 text-center relative z-10 border-r border-gray-850/50">
          <div className="flex flex-col items-center max-w-[480px]">
            <div className="relative flex items-center justify-center w-[120px] h-[120px] mb-8">
              {/* Sun Emblem SVG */}
              <svg className="absolute w-full h-full text-[#ff7448] animate-spin-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="50" cy="50" r="22" />
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 * Math.PI) / 180;
                  const x1 = 50 + Math.cos(angle) * 25;
                  const y1 = 50 + Math.sin(angle) * 25;
                  const x2 = 50 + Math.cos(angle) * 34;
                  const y2 = 50 + Math.sin(angle) * 34;
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" strokeWidth="2.5" />;
                })}
              </svg>
              <span className="text-[#ff7448] font-bold text-5xl z-10 leading-none pt-1">A</span>
            </div>

            <span className="text-[#ff7448] text-[40px] font-extrabold tracking-widest mb-4">
              ASTROLOGER
            </span>
            <h2 className="text-white text-[24px] font-medium tracking-wide mb-3">
              Reset Your Credentials
            </h2>
            <p className="text-gray-400 text-[15px] leading-relaxed font-light">
              Securely retrieve or update your password via one-time passcodes and continue assisting your seekers.
            </p>
          </div>
        </div>

        {/* Right Side: Content Column */}
        <div className="col-span-12 md:col-span-6 lg:col-span-6 h-full flex flex-col justify-center px-8 sm:px-16 md:px-12 lg:px-16 overflow-y-auto relative z-10 bg-transparent">
          <div className="w-full max-w-[400px] mx-auto flex flex-col pt-4 pb-4">
            
            {/* Logo container (Mobile Only) */}
            <div className="flex flex-col items-center mb-3 md:hidden">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-[44px] h-[44px]">
                  <svg className="absolute w-full h-full text-[#ff7448] animate-spin-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="50" cy="50" r="22" />
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i * 30 * Math.PI) / 180;
                      const x1 = 50 + Math.cos(angle) * 25;
                      const y1 = 50 + Math.sin(angle) * 25;
                      const x2 = 50 + Math.cos(angle) * 33;
                      const y2 = 50 + Math.sin(angle) * 33;
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" strokeWidth="3" />;
                    })}
                  </svg>
                  <span className="text-[#ff7448] font-bold text-xl z-10 leading-none pt-1">A</span>
                </div>
                <span className="text-[#ff7448] text-[26px] font-bold tracking-wide">
                  ASTROLOGER
                </span>
              </div>
            </div>

            {/* STEP 1: ENTER MOBILE / EMAIL */}
            {step === 1 && (
              <>
                <h1 className="text-white text-[24px] md:text-[28px] font-semibold mb-1 tracking-wide leading-tight text-center md:text-left">
                  Forgot Password?
                </h1>
                <p className="text-gray-400/80 text-[13px] mb-5 font-medium text-center md:text-left">
                  Enter your registered mobile or email below to receive an OTP.
                </p>

                {step1Error && (
                  <div className="bg-red-500/15 border border-red-500/40 rounded-[12px] p-3.5 text-red-400 text-[13px] font-medium mb-4 text-center">
                    {step1Error}
                  </div>
                )}

                <form onSubmit={handleStep1Submit} className="flex flex-col w-full gap-4">
                  <div>
                    <label className="text-white text-[13px] font-semibold mb-2 block tracking-wide">
                      Email or Mobile
                    </label>
                    <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[14px] px-4 h-[52px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
                      {isNumeric ? (
                        <Phone className="w-[18px] h-[18px] text-gray-400 mr-3 flex-shrink-0" />
                      ) : (
                        <Mail className="w-[18px] h-[18px] text-gray-400 mr-3 flex-shrink-0" />
                      )}
                      <input
                        type="text"
                        required
                        placeholder="Enter Email or Phone Number"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        className="bg-transparent text-white placeholder-gray-500 text-[14px] font-medium focus:outline-none flex-1 h-full"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingStep1}
                    className="bg-[#ff7448] hover:bg-[#ff7448]/95 disabled:opacity-70 text-white font-bold text-[15.5px] h-[52px] rounded-[14px] shadow-lg shadow-[#ff7448]/20 transition-all active:scale-[0.98] mt-1 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingStep1 ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending OTP Code...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 rotate-[-30deg] mt-0.5" />
                        <span>Send OTP Code</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Security Box */}
                <div className="flex items-start gap-3 bg-[#10192A]/50 border border-gray-850 rounded-[14px] p-3 mt-4">
                  <ShieldCheck className="w-5 h-5 text-[#ff7448] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white text-[12.5px] font-bold">Security is our priority</h4>
                    <p className="text-gray-400 text-[11px] mt-0.5 leading-normal">We will never share your information with anyone.</p>
                  </div>
                </div>

                {/* Back to Login Link */}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="flex items-center justify-center gap-2 text-[#ff7448] font-bold text-[14px] hover:underline cursor-pointer mt-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </button>
              </>
            )}

            {/* COMBINED STEP 2: OTP + NEW PASSWORD & CONFIRM PASSWORD */}
            {step === 2 && (
              <>
                {/* Golden Key & Shield Icon Circle */}
                <div className="flex justify-center mb-2">
                  <div className="w-[68px] h-[68px] rounded-full border-2 border-purple-500/20 flex items-center justify-center relative bg-gradient-to-b from-[#1b1435] to-[#120a22] shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                    <KeyRound className="w-[26px] h-[26px] text-[#ffa000]" />
                  </div>
                </div>

                {/* Heading */}
                <h1 className="text-white text-[22px] font-semibold text-center mb-0.5 tracking-wide leading-tight">
                  Reset Password
                </h1>
                <p className="text-gray-400/80 text-[12px] text-center mb-3 leading-relaxed px-1">
                  OTP sent to: <span className="text-[#ff7448] font-bold">{submittedValue}</span>
                  {registeredPhone && <span className="block text-[11.5px] text-[#ffa000] font-semibold mt-1">Sent to registered mobile: {registeredPhone}</span>}
                </p>

                {/* OTP Error Message */}
                {otpError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-[12px] px-3 py-1.5 rounded-[10px] mb-2 text-center font-medium">
                    {otpError}
                  </div>
                )}

                {/* Password Error Message */}
                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-[12px] px-3 py-1.5 rounded-[10px] mb-2 text-center font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleResetPasswordSubmit} className="flex flex-col w-full gap-3">
                  
                  {/* 6-Digit OTP Label & Boxes */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] text-gray-300 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#ff7448]" />
                        <span>Enter 6-Digit OTP Code</span>
                      </label>

                      {/* Resend OTP */}
                      <div className="text-[11.5px] text-gray-400">
                        {canResend ? (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-[#ff7448] font-bold hover:underline cursor-pointer"
                          >
                            Resend OTP
                          </button>
                        ) : (
                          <span>
                            Resend in <span className="text-purple-400 font-bold">{timer}s</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-1">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={otpRefs[idx]}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handlePaste}
                          className="w-10 h-11 sm:w-11 sm:h-12 rounded-[10px] bg-[#10192A]/90 border border-gray-805 text-center text-white text-lg font-bold focus:border-[#ff7448] focus:ring-2 focus:ring-[#ff7448]/30 focus:outline-none transition-all shadow-inner"
                        />
                      ))}
                    </div>
                  </div>

                  {/* New Password Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-300 font-semibold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-[#ff7448]" />
                      <span>New Password</span>
                    </label>
                    <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[12px] px-3.5 h-[48px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        placeholder="Enter New Password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-transparent text-white placeholder-gray-500 text-[13.5px] font-medium focus:outline-none flex-1 h-full pr-7"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 text-gray-400 hover:text-gray-200 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-300 font-semibold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-[#ff7448]" />
                      <span>Confirm Password</span>
                    </label>
                    <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[12px] px-3.5 h-[48px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-transparent text-white placeholder-gray-500 text-[13.5px] font-medium focus:outline-none flex-1 h-full pr-7"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 text-gray-400 hover:text-gray-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Passwords Match status indicator */}
                  {newPassword && confirmPassword && (
                    <div className={`text-[11.5px] font-medium flex items-center gap-1.5 px-0.5 -mt-1 ${newPassword === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${newPassword === confirmPassword ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span>{newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}</span>
                    </div>
                  )}

                  {/* Submit Reset Password Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#ff7448] hover:bg-[#ff7448]/95 text-white font-bold text-[15.5px] h-[48px] rounded-[12px] shadow-lg shadow-[#ff7448]/15 transition-all active:scale-[0.98] mt-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>
                </form>

                {/* Back to Step 1 */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-2 text-gray-400 font-semibold text-[13px] hover:text-white transition-colors cursor-pointer mt-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Mobile / Email</span>
                </button>
              </>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {step === 3 && (
              <div className="flex flex-col items-center text-center animate-fadeIn py-3">
                <div className="w-[74px] h-[74px] rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-[40px] h-[40px] text-emerald-400" />
                </div>

                <h2 className="text-white text-[22px] font-bold mb-2">Password Reset Successful!</h2>
                <p className="text-gray-300 text-[13px] leading-relaxed mb-6 px-1">
                  Your password has been changed successfully. You can now login with your new password.
                </p>

                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full bg-[#ff7448] hover:bg-[#ff7448]/95 text-white font-bold text-[15.5px] h-[50px] rounded-[14px] shadow-lg shadow-[#ff7448]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Back to Login</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

