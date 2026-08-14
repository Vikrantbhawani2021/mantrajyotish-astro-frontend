import { Bell, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { toggleOnlineApi, checkApprovalStatusApi } from "../config/api";
import { subscribeSocketEvent } from "../services/socket";
import WalletModal from "./WalletModal";

export default function Header() {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const fetchHeaderData = async () => {
    try {
      // 1. Initial cached state from localStorage for instant UI rendering
      const cachedStatus = localStorage.getItem("astro_is_online");
      if (cachedStatus !== null) {
        setOnline(cachedStatus === "true");
      }

      // 2. Fetch real online status from backend DB
      const statusData = await checkApprovalStatusApi();
      if (statusData && typeof statusData.isOnline === "boolean") {
        setOnline(statusData.isOnline);
        localStorage.setItem("astro_is_online", String(statusData.isOnline));
      }

      const storedUser = localStorage.getItem("astrologer");
      let astroId = null;
      let phone = null;
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          astroId = parsed._id || parsed.id || parsed.astrologerId;
          phone = parsed.phone || parsed.mobile;
        } catch (e) {}
      }
      const queryParams = new URLSearchParams();
      if (astroId) queryParams.append("userId", astroId);
      if (phone) queryParams.append("phone", phone);

      const token = localStorage.getItem("token") || localStorage.getItem("astrologerToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/wallet/balance?${queryParams.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setWalletBalance(data.data.walletBalance || 0);
        }
      }
    } catch (err) {
      console.error("Header data fetch error:", err);
    }
  };

  // Fetch real online status & wallet balance on header mount
  useEffect(() => {
    fetchHeaderData();
  }, [isWalletOpen]);

  // Real-time wallet balance update on call / chat ended events
  useEffect(() => {
    const unsubEndedChat = subscribeSocketEvent("chatEnded", () => {
      console.log("💬 Chat ended event received in Header - refetching wallet balance...");
      setTimeout(fetchHeaderData, 800); // 800ms offset to guarantee DB write completion
    });
    const unsubEndedCall = subscribeSocketEvent("callEnded", () => {
      console.log("🔴 Call ended event received in Header - refetching wallet balance...");
      setTimeout(fetchHeaderData, 800); // 800ms offset to guarantee DB write completion
    });

    return () => {
      unsubEndedChat();
      unsubEndedCall();
    };
  }, []);

  const astroUser = (() => {
    try {
      const keys = ["astrologerUser", "astrologer_profile_data", "astrologer_profile_draft", "user", "astrologer"];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v) {
          const p = JSON.parse(v);
          if (p.name || p.firstname || p.astrologerName || p.email) return p;
        }
      }
    } catch {}
    return {};
  })();

  const astroName = astroUser.name || astroUser.firstname || astroUser.astrologerName || astroUser.username || "Astrologer";
  const astroSpec = astroUser.specialization 
    ? (Array.isArray(astroUser.specialization) ? astroUser.specialization.join(", ") : astroUser.specialization) 
    : (astroUser.skills || "Vedic Astrology Expert");

  const handleToggleStatus = async () => {
    const nextState = !online;
    setLoading(true);
    try {
      const updatedStatus = await toggleOnlineApi(nextState);
      if (typeof updatedStatus === "boolean") {
        setOnline(updatedStatus);
        localStorage.setItem("astro_is_online", String(updatedStatus));
      }
    } catch (err) {
      console.error("Toggle online status error:", err);
      setOnline(online); // Revert switch state on error
      alert("Only approved astrologers can switch to Online mode.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">

      {/* Orange Header */}
      <div className="rounded-b-[35px] bg-gradient-to-br from-[#ff8f6c] via-[#ff7448] to-[#ff5c33] px-6 pt-7 pb-5 flex flex-col justify-between min-h-[200px]">

        <div className="flex justify-between items-start">

          <div>
            <p className="text-white/80 text-[13.5px] font-medium">
              Welcome back, 👋
            </p>

            <h1 className="text-white text-[24px] font-bold mt-0.5 leading-tight">
              {astroName}
            </h1>
            <p className="text-orange-100 text-xs mt-1 font-medium opacity-90 truncate max-w-[200px]">
              {astroSpec}
            </p>
          </div>

          {/* Right Action Icons (Wallet & Bell Notification) */}
          <div className="flex items-center gap-2.5">
            {/* Wallet Button */}
            <button 
              onClick={() => setIsWalletOpen(true)}
              className="h-[48px] px-3.5 rounded-[16px] bg-white/10 hover:bg-white/20 backdrop-blur-xl shadow-2xl flex items-center gap-2 text-white border border-white/15 transition-all cursor-pointer active:scale-95"
              title="Astrologer Wallet"
            >
              <Wallet className="w-5 h-5 text-amber-300" />
              <span className="text-[13.5px] font-bold">₹{walletBalance.toLocaleString("en-IN")}</span>
            </button>

            {/* Bell Icon Container */}
            <div className="w-[48px] h-[48px] rounded-[16px] bg-white/10 backdrop-blur-xl shadow-2xl flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all">
              <Bell className="text-white w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Status Card */}
        <div className="bg-white rounded-[18px] shadow-xl px-4 h-[64px] flex items-center justify-between mt-3">

          <div className="flex items-center gap-2.5">

            <div
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                online ? "bg-green-500" : "bg-red-500"
              }`}
            />

            <h2 className="text-[16px] font-semibold text-gray-700">
              {online ? "You are Online" : "You are Offline"}
            </h2>

          </div>

          {/* Toggle */}
          <button
            onClick={handleToggleStatus}
            disabled={loading}
            className={`relative w-[58px] h-[32px] rounded-full transition-all duration-300 cursor-pointer ${
              online ? "bg-green-500" : "bg-[#DDD9E8]"
            } ${loading ? "opacity-80 cursor-wait" : ""}`}
          >
            <div
              className={`absolute top-[4px] w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                online ? "left-[30px]" : "left-[4px]"
              }`}
            />
          </button>

        </div>

      </div>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={isWalletOpen} 
        onClose={() => setIsWalletOpen(false)} 
      />

    </div>
  );
}