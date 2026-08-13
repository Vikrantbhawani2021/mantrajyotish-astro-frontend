import { useState, useRef, useEffect } from "react";
import { API_ENDPOINTS, uploadImageApi } from "../config/api";
import { 
  User, Crown, Phone, Mail, MapPin, ChevronDown, 
  ArrowLeft, ArrowRight, Camera, Plus, Globe, 
  Briefcase, GraduationCap, Sparkles, Check,
  Target, Heart, DollarSign, Leaf, Compass, Flower2, Star,
  UploadCloud, Award, Eye, EyeOff, ShieldCheck, FileText, Lock,
  Sun, Disc, Radio, Clock, Gem, MessageSquare, Hand, Loader2
} from "lucide-react";

const getSavedDraft = () => {
  try {
    const saved = localStorage.getItem("astrologer_profile_draft");
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

export default function CreateProfile({ onCreateSuccess, onBack }) {
  const savedDraft = getSavedDraft();

  const [step, setStep] = useState(savedDraft.step || 1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);
  const certInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Scroll to top of container whenever step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [step]);

  const [profilePhoto, setProfilePhoto] = useState(savedDraft.profilePhoto || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [fullName, setFullName] = useState(savedDraft.fullName || "");
  const [mobileNumber, setMobileNumber] = useState(savedDraft.mobileNumber || "");
  const [emailAddress, setEmailAddress] = useState(savedDraft.emailAddress || "");
  const [location, setLocation] = useState(savedDraft.location || "");
  const [password, setPassword] = useState(savedDraft.password || "");
  const [confirmPassword, setConfirmPassword] = useState(savedDraft.confirmPassword || "");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states - Step 2 (About You)
  const [introduction, setIntroduction] = useState(savedDraft.introduction || "");
  const [experience, setExperience] = useState(savedDraft.experience || "");
  const [selectedStrengths, setSelectedStrengths] = useState(savedDraft.selectedStrengths || []);
  const [approach, setApproach] = useState(savedDraft.approach || "");
  const [motivation, setMotivation] = useState(savedDraft.motivation || "");
  const [languages, setLanguages] = useState(savedDraft.languages || []);

  // Form states - Step 3 (Expertise)
  const [selectedSpecializations, setSelectedSpecializations] = useState(savedDraft.selectedSpecializations || []);
  const [toolsTechniques, setToolsTechniques] = useState(savedDraft.toolsTechniques || "");
  const [certificateFile, setCertificateFile] = useState(savedDraft.certificateFile || null);
  const [certificateName, setCertificateName] = useState(savedDraft.certificateName || "");
  const [achievements, setAchievements] = useState(savedDraft.achievements || "");

  // Auto-save form draft whenever any field changes
  useEffect(() => {
    const draftData = {
      step,
      profilePhoto,
      fullName,
      mobileNumber,
      emailAddress,
      location,
      password,
      introduction,
      experience,
      selectedStrengths,
      approach,
      motivation,
      languages,
      selectedSpecializations,
      toolsTechniques,
      certificateFile,
      certificateName,
      achievements
    };
    localStorage.setItem("astrologer_profile_draft", JSON.stringify(draftData));
  }, [
    step, profilePhoto, fullName, mobileNumber, emailAddress, location, password,
    introduction, experience, selectedStrengths, approach, motivation, languages,
    selectedSpecializations, toolsTechniques, certificateFile, certificateName, achievements
  ]);

  // Dropdown visibility states
  const [showExpDropdownStep2, setShowExpDropdownStep2] = useState(false);
  const [showExpDropdownStep3, setShowExpDropdownStep3] = useState(false);
  const [showApproachDropdown, setShowApproachDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Global Click-Outside & Escape Key listener to close all dropdowns
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest(".custom-dropdown-container")) {
        setShowExpDropdownStep2(false);
        setShowExpDropdownStep3(false);
        setShowApproachDropdown(false);
        setShowLangDropdown(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowExpDropdownStep2(false);
        setShowExpDropdownStep3(false);
        setShowApproachDropdown(false);
        setShowLangDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("touchstart", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Options
  const experienceOptions = [
    "Less than 1 Year",
    "1 - 3 Years",
    "3 - 5 Years",
    "5+ Years Experience",
    "10+ Years Experience"
  ];

  const approachOptions = [
    "Vedic Astrology & Remedies",
    "Practical & Solution Oriented",
    "KP System & Prashna Kundali",
    "Numerology & Name Correction",
    "Tarot Reading & Intuitive Guidance",
    "Vastu Shastra & Energy Balancing"
  ];

  const strengthsOptions = [
    { id: "accurate", label: "Accurate Predictions", icon: Target },
    { id: "career", label: "Career Guidance", icon: Briefcase },
    { id: "relationship", label: "Relationship Advice", icon: Heart },
    { id: "financial", label: "Financial Guidance", icon: DollarSign },
    { id: "health", label: "Health & Wellness", icon: Leaf },
    { id: "vastu", label: "Vastu Guidance", icon: Compass },
    { id: "spiritual", label: "Spiritual Guidance", icon: Flower2 },
  ];

  const specializationsOptions = [
    { id: "vedic", label: "Vedic Astrology", icon: Sun },
    { id: "kp", label: "KP Astrology", icon: Target },
    { id: "nadi", label: "Nadi Astrology", icon: Radio },
    { id: "numerology", label: "Numerology", icon: Disc },
    { id: "tarot", label: "Tarot Reading", icon: FileText },
    { id: "palmistry", label: "Palmistry", icon: Hand },
    { id: "vastu_spec", label: "Vastu Shastra", icon: Compass },
    { id: "lalkitab", label: "Lal Kitab", icon: Award },
    { id: "prashna", label: "Prashna Kundali", icon: Compass },
    { id: "muhurat", label: "Muhurat", icon: Clock },
    { id: "gemstone", label: "Gemstone Guidance", icon: Gem },
    { id: "other", label: "Other", icon: MessageSquare },
  ];

  const languageOptions = [
    "Hindi", "English", "Sanskrit", "Punjabi", 
    "Gujarati", "Marathi", "Tamil", "Bengali", "Telugu", "Kannada"
  ];

  // Handlers
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingPhoto(true);
      try {
        const uploadedUrl = await uploadImageApi(file);
        setProfilePhoto(uploadedUrl);
      } catch (err) {
        console.error("Photo upload error:", err);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleCertUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateName(file.name);
      setUploadingCert(true);
      try {
        const uploadedUrl = await uploadImageApi(file);
        setCertificateFile(uploadedUrl);
      } catch (err) {
        console.error("Certificate upload error:", err);
      } finally {
        setUploadingCert(false);
      }
    }
  };

  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) {
      setMobileNumber(val);
    }
  };

  const handleStrengthToggle = (label) => {
    if (selectedStrengths.includes(label)) {
      setSelectedStrengths(selectedStrengths.filter(s => s !== label));
    } else {
      if (selectedStrengths.length < 5) {
        setSelectedStrengths([...selectedStrengths, label]);
      } else {
        alert("You can select up to 5 strengths.");
      }
    }
  };

  const handleSpecToggle = (label) => {
    if (selectedSpecializations.includes(label)) {
      setSelectedSpecializations(selectedSpecializations.filter(s => s !== label));
    } else {
      if (selectedSpecializations.length < 5) {
        setSelectedSpecializations([...selectedSpecializations, label]);
      } else {
        alert("You can select up to 5 specializations.");
      }
    }
  };

  const handleLangToggle = (lang) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  // Validation before going to next step
  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim() || !mobileNumber.trim() || !emailAddress.trim() || !location.trim() || !password.trim() || !confirmPassword.trim()) {
        alert("Please fill all required basic information fields (Full Name, Mobile, Email, Location, Password, Confirm Password).");
        return;
      }
      if (mobileNumber.length !== 10) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (password !== confirmPassword) {
        alert("Password and Confirm Password do not match. Please check your password.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!introduction.trim()) {
        alert("Please enter a short introduction.");
        return;
      }
      if (!experience) {
        alert("Please select your years of experience.");
        return;
      }
      if (!motivation.trim()) {
        alert("Please share your motivation for helping people.");
        return;
      }
      if (languages.length === 0) {
        alert("Please select at least one language you speak.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (selectedSpecializations.length === 0) {
        alert("Please select at least one specialization.");
        return;
      }
      if (!experience) {
        alert("Please select your years of experience in astrology.");
        return;
      }
      setStep(4);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      if (onBack) onBack();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    const payload = {
      name: fullName.trim(),
      fullName: fullName.trim(),
      phone: mobileNumber.trim(),
      mobileNumber: mobileNumber.trim(),
      email: emailAddress.trim(),
      location: location.trim(),
      password: password.trim() || "Astro@12345",
      profilePhoto: profilePhoto || "",
      profileImage: profilePhoto || "",
      introduction: introduction.trim(),
      about: introduction.trim(),
      experience: experience,
      strengths: selectedStrengths,
      approach: approach,
      motivation: motivation.trim(),
      languages: languages,
      specialization: selectedSpecializations,
      specializations: selectedSpecializations,
      tools: toolsTechniques.trim(),
      toolsTechniques: toolsTechniques.trim(),
      certificate: certificateFile || certificateName || "",
      certificateFile: certificateFile || "",
      certificateName: certificateName || "",
      achievements: achievements.trim()
    };

    console.log("Saving Profile Data locally & sending to Backend API:", payload);
    localStorage.setItem("astrologer_profile_data", JSON.stringify(payload));
    
    try {
      const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/astrologer";
      const createAstroUrl = apiBaseUrl.replace(/\/astrologer\/?$/, '/astro/create');
      await fetch(createAstroUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
    } catch (apiErr) {
      console.warn("Failed to send profile to backend API on form submit:", apiErr);
    }

    setLoading(false);
    onCreateSuccess();
  };

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex items-center justify-center p-0 sm:p-4 overflow-x-hidden">
      <div className="w-full md:max-w-[850px] lg:max-w-[960px] h-screen sm:h-[92vh] sm:rounded-[32px] bg-[#FAF6F2] overflow-hidden flex flex-col relative shadow-2xl border border-gray-100">
        
        {/* Top Header Background with Zodiac Wheel Symbol SVG */}
        <div className="relative bg-gradient-to-b from-[#FFF0E6] to-[#FAF6F2] pt-6 pb-4 px-6 flex-shrink-0">
          <div className="absolute right-0 top-0 w-44 h-44 opacity-25 pointer-events-none overflow-hidden select-none">
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
              <g transform="translate(32, 32) scale(0.36)" fill="currentColor" stroke="none">
                <path d="M50 15c4.4 0 8-3.6 8-8s-3.6-8-8-8-8 3.6-8 8 3.6 8 8 8zm24 53c-1.7 0-3.3.6-4.6 1.7L54 82.8v-32c5.8-2.6 10-8.5 10-15.3 0-9.4-7.6-17-17-17S30 26.1 30 35.5c0 6.8 4.2 12.7 10 15.3v32L24.6 70.8C23.3 69.7 21.7 69.1 20 69.1c-3.9 0-7 3.1-7 7 0 2.2 1 4.1 2.6 5.4l21.9 18c1.3 1.1 3 1.7 4.7 1.7h15.6c1.7 0 3.4-.6 4.7-1.7l21.9-18c1.6-1.3 2.6-3.2 2.6-5.4.1-3.9-3.1-7-7.1-7z" />
              </g>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col">
            <button onClick={handlePrev} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/60 hover:bg-white active:scale-95 transition-all cursor-pointer shadow-sm text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[24px] font-bold text-gray-800 mt-4 leading-tight">Create Profile</h1>
            <p className="text-[13px] text-gray-500 font-medium mt-1">
              Build your astrologer profile and start helping people.
            </p>
          </div>
        </div>

        {/* Multi-step progress bar (4 Steps) */}
        <div className="px-8 py-3 relative z-10 mb-4 flex-shrink-0">
          {/* Progress connecting line - aligned to exact center of w-9 h-9 circles (18px from top) */}
          <div className="absolute left-12 right-12 top-[30px] -translate-y-1/2 h-[2px] bg-gray-200 z-0">
            <div 
              className="h-full bg-[#ff7448] transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            {[
              { num: 1, label: "Basic Info" },
              { num: 2, label: "About You" },
              { num: 3, label: "Expertise" },
              { num: 4, label: "Preview" }
            ].map((s) => {
              const isActive = step >= s.num;
              const isCompleted = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center gap-1.5 min-w-[70px]">
                  <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] transition-all duration-300 z-10 ${
                      isCurrent 
                        ? "bg-[#ff7448] text-white shadow-md shadow-[#ff7448]/30 scale-110" 
                        : isCompleted 
                          ? "bg-[#ff7448] text-white" 
                          : "bg-white text-gray-400 border border-gray-200 shadow-xs"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4.5 h-4.5 stroke-[3]" /> : s.num}
                  </div>
                  <span className={`text-[11px] font-bold text-center whitespace-nowrap transition-all duration-300 ${isActive ? "text-[#ff7448]" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 pb-32 no-scrollbar">
          <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-gray-100/50 flex flex-col gap-6">

            {/* STEP 1: BASIC INFO */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                {/* Profile Photo */}
                <div className="flex flex-col items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="text-[14px] font-bold text-gray-800 self-start">Profile Photo</span>
                  <p className="text-[12px] text-gray-400 font-medium self-start -mt-2">Upload a clear photo to build trust</p>
                  
                  <div className="relative mt-2">
                    <div 
                      onClick={() => !uploadingPhoto && fileInputRef.current.click()}
                      className="w-24 h-24 rounded-full border-2 border-dashed border-[#ff7448]/40 bg-[#FFF6F0] flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#FFEFE6] transition-all overflow-hidden relative"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-6 h-6 text-[#ff7448] animate-spin" />
                      ) : profilePhoto ? (
                        <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-[#ff7448]" />
                          <span className="text-[11px] font-bold text-[#ff7448]">Upload Photo</span>
                        </>
                      )}
                    </div>
                    {profilePhoto && (
                      <button 
                        onClick={() => fileInputRef.current.click()} 
                        className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#ff7448] text-white flex items-center justify-center shadow-md hover:bg-[#e05e35] transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 rotate-45" />
                      </button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload} 
                  />
                </div>

                {/* Basic Information Form */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0E6] flex items-center justify-center text-[#ff7448] flex-shrink-0 border border-[#ff7448]/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-gray-800 leading-tight">Basic Information</h2>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  {/* Full Name */}
                  <div className="relative flex items-center bg-gray-50/70 border border-gray-200/90 rounded-[16px] px-4 h-[52px] focus-within:border-[#ff7448] focus-within:bg-white transition-all">
                    <User className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
                    <input 
                      type="text"
                      placeholder="Full Name *"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-transparent text-gray-800 placeholder-gray-400 text-[13.5px] font-medium focus:outline-none flex-1 h-full"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="relative flex items-center bg-gray-50/70 border border-gray-200/90 rounded-[16px] px-4 h-[52px] focus-within:border-[#ff7448] focus-within:bg-white transition-all">
                    <Phone className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
                    <input 
                      type="text"
                      maxLength={10}
                      placeholder="Mobile Number *"
                      value={mobileNumber}
                      onChange={handleMobileChange}
                      className="bg-transparent text-gray-800 placeholder-gray-400 text-[13.5px] font-medium focus:outline-none flex-1 h-full"
                    />
                    {mobileNumber.length > 0 && (
                      <span className="text-[11px] font-bold text-gray-400">
                        {mobileNumber.length}/10
                      </span>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="relative flex items-center bg-gray-50/70 border border-gray-200/90 rounded-[16px] px-4 h-[52px] focus-within:border-[#ff7448] focus-within:bg-white transition-all">
                    <Mail className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
                    <input 
                      type="email"
                      placeholder="Email Address *"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="bg-transparent text-gray-800 placeholder-gray-400 text-[13.5px] font-medium focus:outline-none flex-1 h-full"
                    />
                  </div>

                  {/* Location */}
                  <div className="relative flex items-center bg-gray-50/70 border border-gray-200/90 rounded-[16px] px-4 h-[52px] focus-within:border-[#ff7448] focus-within:bg-white transition-all">
                    <MapPin className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
                    <input 
                      type="text"
                      placeholder="Location (City, Country) *"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-transparent text-gray-800 placeholder-gray-400 text-[13.5px] font-medium focus:outline-none flex-1 h-full"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative flex items-center bg-gray-50/70 border border-gray-200/90 rounded-[16px] px-4 h-[52px] focus-within:border-[#ff7448] focus-within:bg-white transition-all">
                    <Lock className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Create Password *"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-transparent text-gray-800 placeholder-gray-400 text-[13.5px] font-medium focus:outline-none flex-1 h-full tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer ml-2 flex-shrink-0"
                    >
                      {showPassword ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative flex items-center bg-gray-50/70 border border-gray-200/90 rounded-[16px] px-4 h-[52px] focus-within:border-[#ff7448] focus-within:bg-white transition-all">
                    <Lock className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password *"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-transparent text-gray-800 placeholder-gray-400 text-[13.5px] font-medium focus:outline-none flex-1 h-full tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer ml-2 flex-shrink-0"
                    >
                      {showConfirmPassword ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 2: ABOUT YOU */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0E6] flex items-center justify-center text-[#ff7448] flex-shrink-0 border border-[#ff7448]/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-gray-800 leading-tight">About You</h2>
                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">Tell clients about yourself and your journey.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">
                    Introduction <span className="text-[#ff7448]">*</span>
                  </label>
                  <div className="relative">
                    <textarea 
                      rows="4"
                      maxLength="500"
                      placeholder="Write a short introduction about yourself, your journey, your experience and your approach..."
                      value={introduction}
                      onChange={(e) => setIntroduction(e.target.value)}
                      className="w-full bg-gray-50/60 border border-gray-200 rounded-[16px] p-3.5 pb-7 text-[13.5px] font-medium text-gray-800 placeholder-gray-400 focus:border-[#ff7448] focus:bg-white focus:outline-none transition-all resize-none leading-relaxed"
                    />
                    <div className="absolute bottom-2.5 right-3.5 text-[11px] font-bold text-gray-400">
                      {introduction.length}/500
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative custom-dropdown-container">
                  <label className="text-[13px] font-bold text-gray-700">
                    Years of Experience <span className="text-[#ff7448]">*</span>
                  </label>
                  <div 
                    onClick={() => setShowExpDropdownStep2(!showExpDropdownStep2)}
                    className="flex items-center justify-between bg-gray-50/60 border border-gray-200 rounded-[16px] px-4 h-[50px] cursor-pointer hover:bg-gray-100/50 focus-within:border-[#ff7448] transition-all"
                  >
                    <div className="flex items-center">
                      <Briefcase className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
                      <span className={`text-[13.5px] font-medium ${experience ? "text-gray-800 font-semibold" : "text-gray-400"}`}>
                        {experience || "Select experience"}
                      </span>
                    </div>
                    <ChevronDown className={`w-4.5 h-4.5 text-gray-400 transition-transform ${showExpDropdownStep2 ? "rotate-180" : ""}`} />
                  </div>
                  {showExpDropdownStep2 && (
                    <div className="absolute top-[76px] left-0 right-0 bg-white border border-gray-200 rounded-[16px] shadow-xl max-h-[200px] overflow-y-auto z-30 p-2 flex flex-col gap-1">
                      {experienceOptions.map((opt) => (
                        <div 
                          key={opt}
                          onClick={() => {
                            setExperience(opt);
                            setShowExpDropdownStep2(false);
                          }}
                          className={`px-3.5 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer transition-all ${
                            experience === opt ? "bg-[#FFF0E6] text-[#ff7448]" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700">
                    My Strengths <span className="text-gray-400 font-medium">(Select up to 5)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {strengthsOptions.map((item) => {
                      const IconComponent = item.icon;
                      const isSelected = selectedStrengths.includes(item.label);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleStrengthToggle(item.label)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[12.5px] font-bold border transition-all cursor-pointer active:scale-95 ${
                            isSelected 
                              ? "bg-[#ff7448] text-white border-[#ff7448] shadow-sm" 
                              : "bg-[#FFF6F0]/80 text-[#d65329] border-[#ff7448]/30 hover:bg-[#FFF0E6]"
                          }`}
                        >
                          <IconComponent className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-[#ff7448]"}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative custom-dropdown-container">
                  <label className="text-[13px] font-bold text-gray-700">
                    My Approach
                  </label>
                  <div 
                    onClick={() => setShowApproachDropdown(!showApproachDropdown)}
                    className="flex items-center justify-between bg-gray-50/60 border border-gray-200 rounded-[16px] px-4 h-[50px] cursor-pointer hover:bg-gray-100/50 focus-within:border-[#ff7448] transition-all"
                  >
                    <div className="flex items-center">
                      <Star className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
                      <span className={`text-[13.5px] font-medium ${approach ? "text-gray-800 font-semibold" : "text-gray-400"}`}>
                        {approach || "Select your approach"}
                      </span>
                    </div>
                    <ChevronDown className={`w-4.5 h-4.5 text-gray-400 transition-transform ${showApproachDropdown ? "rotate-180" : ""}`} />
                  </div>
                  {showApproachDropdown && (
                    <div className="absolute top-[76px] left-0 right-0 bg-white border border-gray-200 rounded-[16px] shadow-xl max-h-[200px] overflow-y-auto z-30 p-2 flex flex-col gap-1">
                      {approachOptions.map((opt) => (
                        <div 
                          key={opt}
                          onClick={() => {
                            setApproach(opt);
                            setShowApproachDropdown(false);
                          }}
                          className={`px-3.5 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer transition-all ${
                            approach === opt ? "bg-[#FFF0E6] text-[#ff7448]" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">
                    Why do you want to help people? <span className="text-[#ff7448]">*</span>
                  </label>
                  <div className="relative">
                    <textarea 
                      rows="3"
                      maxLength="300"
                      placeholder="Share your purpose and what motivates you to guide others..."
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      className="w-full bg-gray-50/60 border border-gray-200 rounded-[16px] p-3.5 pb-7 text-[13.5px] font-medium text-gray-800 placeholder-gray-400 focus:border-[#ff7448] focus:bg-white focus:outline-none transition-all resize-none leading-relaxed"
                    />
                    <div className="absolute bottom-2.5 right-3.5 text-[11px] font-bold text-gray-400">
                      {motivation.length}/300
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative custom-dropdown-container">
                  <label className="text-[13px] font-bold text-gray-700">
                    Languages you speak <span className="text-[#ff7448]">*</span>
                  </label>
                  <div 
                    onClick={() => setShowLangDropdown(!showLangDropdown)}
                    className="flex items-center justify-between bg-gray-50/60 border border-gray-200 rounded-[16px] px-4 min-h-[50px] py-2.5 cursor-pointer hover:bg-gray-100/50 focus-within:border-[#ff7448] transition-all"
                  >
                    <div className="flex items-center flex-wrap gap-1.5 flex-1 min-w-0">
                      <Globe className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
                      {languages.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {languages.map((l) => (
                            <span key={l} className="bg-[#FFF0E6] text-[#ff7448] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#ff7448]/20">
                              {l}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[13.5px] font-medium text-gray-400">Select languages</span>
                      )}
                    </div>
                    <ChevronDown className={`w-4.5 h-4.5 text-gray-400 transition-transform flex-shrink-0 ${showLangDropdown ? "rotate-180" : ""}`} />
                  </div>
                  {showLangDropdown && (
                    <div className="absolute top-[76px] left-0 right-0 bg-white border border-gray-200 rounded-[16px] shadow-xl max-h-[200px] overflow-y-auto z-30 p-2 grid grid-cols-2 gap-1">
                      {languageOptions.map((opt) => {
                        const isSelected = languages.includes(opt);
                        return (
                          <div 
                            key={opt}
                            onClick={() => handleLangToggle(opt)}
                            className={`px-3 py-2 text-[12.5px] font-semibold rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                              isSelected 
                                ? "bg-[#FFF0E6] text-[#ff7448] border border-[#ff7448]/20" 
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* STEP 3: EXPERTISE */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0E6] flex items-center justify-center text-[#ff7448] flex-shrink-0 border border-[#ff7448]/20">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-gray-800 leading-tight">Expertise</h2>
                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">Tell us about your skills and specializations.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700">
                    My Specializations <span className="text-gray-400 font-medium">(Select up to 5)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {specializationsOptions.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = selectedSpecializations.includes(item.label);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSpecToggle(item.label)}
                          className={`flex items-center justify-between px-2.5 py-2.5 rounded-[14px] text-[11.5px] font-bold border transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-[#FFF0E6] text-[#d65329] border-[#ff7448] shadow-sm" 
                              : "bg-white text-gray-700 border-gray-200/80 hover:bg-[#FFF6F0]/60"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IconComp className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-[#ff7448]" : "text-[#ff7448]/80"}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-[#ff7448] text-white flex items-center justify-center ml-1 flex-shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">
                    Tools & Techniques You Use
                  </label>
                  <div className="relative">
                    <textarea 
                      rows="3"
                      maxLength="200"
                      placeholder="e.g. Kundli Matching, Dasha Analysis, Transit Reading, etc."
                      value={toolsTechniques}
                      onChange={(e) => setToolsTechniques(e.target.value)}
                      className="w-full bg-gray-50/60 border border-gray-200 rounded-[16px] p-3.5 pb-7 text-[13.5px] font-medium text-gray-800 placeholder-gray-400 focus:border-[#ff7448] focus:bg-white focus:outline-none transition-all resize-none leading-relaxed"
                    />
                    <div className="absolute bottom-2.5 right-3.5 text-[11px] font-bold text-gray-400">
                      {toolsTechniques.length}/200
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative custom-dropdown-container">
                  <label className="text-[13px] font-bold text-gray-700">
                    Years of Experience in Astrology <span className="text-[#ff7448]">*</span>
                  </label>
                  <div 
                    onClick={() => setShowExpDropdownStep3(!showExpDropdownStep3)}
                    className="flex items-center justify-between bg-gray-50/60 border border-gray-200 rounded-[16px] px-4 h-[50px] cursor-pointer hover:bg-gray-100/50 focus-within:border-[#ff7448] transition-all"
                  >
                    <div className="flex items-center">
                      <Briefcase className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
                      <span className={`text-[13.5px] font-medium ${experience ? "text-gray-800 font-semibold" : "text-gray-400"}`}>
                        {experience || "Select experience"}
                      </span>
                    </div>
                    <ChevronDown className={`w-4.5 h-4.5 text-gray-400 transition-transform ${showExpDropdownStep3 ? "rotate-180" : ""}`} />
                  </div>
                  {showExpDropdownStep3 && (
                    <div className="absolute top-[76px] left-0 right-0 bg-white border border-gray-200 rounded-[16px] shadow-xl max-h-[200px] overflow-y-auto z-30 p-2 flex flex-col gap-1">
                      {experienceOptions.map((opt) => (
                        <div 
                          key={opt}
                          onClick={() => {
                            setExperience(opt);
                            setShowExpDropdownStep3(false);
                          }}
                          className={`px-3.5 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer transition-all ${
                            experience === opt ? "bg-[#FFF0E6] text-[#ff7448]" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">
                    Certifications <span className="text-gray-400 font-medium">(If any)</span>
                  </label>
                  <div 
                    onClick={() => certInputRef.current.click()}
                    className="flex items-center justify-between bg-gray-50/50 border border-gray-200 rounded-[18px] p-4 cursor-pointer hover:bg-[#FFF6F0]/40 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-[#ff7448] group-hover:border-[#ff7448]/30 transition-all shadow-sm">
                        {uploadingCert ? <Loader2 className="w-6 h-6 text-[#ff7448] animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                      </div>
                      <div>
                        <span className="text-[13.5px] font-bold text-gray-800 block">
                          {certificateName || "Upload Certificate"}
                        </span>
                        <span className="text-[11.5px] text-gray-400 font-medium block mt-0.5">
                          JPG, PNG or PDF (Max 5MB)
                        </span>
                      </div>
                    </div>

                    <div className="w-14 h-12 bg-[#FFF3EB] rounded-xl border border-[#ff7448]/20 flex items-center justify-center relative shadow-sm overflow-hidden">
                      <div className="w-8 h-6 bg-white rounded border border-[#ff7448]/30 flex flex-col gap-1 p-1">
                        <div className="w-4 h-1 bg-[#ff7448]/40 rounded-full" />
                        <div className="w-5 h-1 bg-gray-300 rounded-full" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ff7448] text-white flex items-center justify-center text-[8px] font-black border border-white">
                        ★
                      </div>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={certInputRef} 
                    accept=".jpg,.png,.pdf" 
                    className="hidden" 
                    onChange={handleCertUpload} 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">
                    Achievements <span className="text-gray-400 font-medium">(Optional)</span>
                  </label>
                  <div className="relative">
                    <textarea 
                      rows="3"
                      maxLength="200"
                      placeholder="Share your achievements, awards or recognitions..."
                      value={achievements}
                      onChange={(e) => setAchievements(e.target.value)}
                      className="w-full bg-gray-50/60 border border-gray-200 rounded-[16px] p-3.5 pb-7 text-[13.5px] font-medium text-gray-800 placeholder-gray-400 focus:border-[#ff7448] focus:bg-white focus:outline-none transition-all resize-none leading-relaxed"
                    />
                    <div className="absolute bottom-2.5 right-3.5 text-[11px] font-bold text-gray-400">
                      {achievements.length}/200
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 4: PREVIEW PROFILE */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0E6] flex items-center justify-center text-[#ff7448] flex-shrink-0 border border-[#ff7448]/20">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-gray-800 leading-tight">Preview Profile</h2>
                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">Review your information before going live.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <span className="text-[14px] font-bold text-gray-800">Profile Preview</span>

                  <div className="bg-white border border-gray-200/90 rounded-[20px] p-5 shadow-sm flex flex-col gap-5">
                    
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-full bg-[#FFF0E6] border-2 border-white shadow-md overflow-hidden flex-shrink-0 flex items-center justify-center text-[#ff7448]">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-9 h-9" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <h3 className="text-[18px] font-bold text-gray-900 leading-snug">
                          {fullName || "Acharya Astrologer"}
                        </h3>
                        <p className="text-[13px] font-bold text-[#ff7448] mt-0.5">
                          {selectedSpecializations.slice(0, 2).join(" & ") || "Vedic Astrologer & Numerologist"}
                        </p>

                        <div className="inline-flex items-center gap-1.5 bg-[#F3E8FF] text-[#7E22CE] px-3 py-1 rounded-lg text-[11.5px] font-bold mt-2.5 self-start">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#7E22CE]" />
                          <span>{experience || "5+ Years Experience"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-[1px] bg-gray-150" />

                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[13.5px] font-bold text-gray-800">About Me</h4>
                      <p className="text-[12.5px] text-gray-600 font-medium leading-relaxed">
                        {introduction || "I am a passionate astrologer with experience helping people find clarity and solutions in their life problems."}
                      </p>
                    </div>

                    <div className="w-full h-[1px] bg-gray-150" />

                    <div className="flex flex-col gap-2">
                      <h4 className="text-[13.5px] font-bold text-gray-800">My Specializations</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedSpecializations.length > 0 
                          ? selectedSpecializations 
                          : ["Vedic Astrology", "Numerology", "Tarot Reading", "Vastu Shastra"]
                        ).map((spec) => (
                          <span 
                            key={spec}
                            className="bg-[#FFF3EB] text-[#d65329] text-[12px] font-bold px-3 py-1 rounded-full border border-[#ff7448]/20"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="w-full h-[1px] bg-gray-150" />

                    <div className="grid grid-cols-2 gap-4 text-[12px]">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-gray-400 font-medium block">Experience</span>
                            <span className="text-gray-800 font-bold block mt-0.5">{experience || "5+ Years"}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Globe className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-gray-400 font-medium block">Language</span>
                            <span className="text-gray-800 font-bold block mt-0.5">
                              {languages.length > 0 ? languages.join(", ") : "Hindi, English"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-gray-400 font-medium block">Approach</span>
                            <span className="text-gray-800 font-bold block mt-0.5">
                              {approach || "Practical & Solution Oriented"}
                            </span>
                          </div>
                        </div>

                        {selectedStrengths.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Star className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-gray-400 font-medium block">Strengths</span>
                              <span className="text-gray-800 font-bold block mt-0.5">
                                {selectedStrengths.join(", ")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full h-[1px] bg-gray-150" />

                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[13.5px] font-bold text-gray-800">Why I Help People</h4>
                      <p className="text-[12.5px] text-gray-600 font-medium leading-relaxed">
                        {motivation || "I truly believe that astrology is a divine tool to guide people towards a better life."}
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Bottom Next/Submit Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#FAF6F2] border-t border-gray-200/50 px-6 pt-3 pb-4 flex flex-col gap-2 z-20">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button 
                type="button"
                onClick={handlePrev}
                className="flex-1 border border-[#ff7448] text-[#ff7448] rounded-[16px] h-[50px] font-bold flex items-center justify-center gap-2 hover:bg-[#FFF0E6]/50 active:scale-98 transition-all cursor-pointer bg-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {step < 4 ? (
              <button 
                type="button"
                onClick={handleNext}
                className="flex-1 bg-[#ff7448] text-white rounded-[16px] h-[50px] font-bold flex items-center justify-center gap-2 hover:bg-[#e05e35] active:scale-98 transition-all cursor-pointer shadow-md shadow-[#ff7448]/20"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex-[1.5] bg-gradient-to-r from-[#ff7448] to-[#ff5c33] text-white rounded-[16px] h-[50px] font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#ff7448]/30 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Save & Continue</span>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            )}
          </div>

          {step === 4 && (
            <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-gray-400 font-medium">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>You can edit your profile anytime later.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
