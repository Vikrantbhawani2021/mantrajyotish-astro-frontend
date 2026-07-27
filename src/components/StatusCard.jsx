import { useState } from "react";
import { toggleOnlineApi } from "../config/api";

export default function StatusCard() {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleStatus = async () => {
    const nextState = !online;
    setOnline(nextState);
    setLoading(true);
    try {
      const updatedStatus = await toggleOnlineApi(nextState);
      setOnline(updatedStatus);
    } catch (err) {
      console.error("Toggle online status error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[92px] bg-white rounded-[28px] shadow-lg px-6 flex items-center justify-between">

      {/* Left Side */}
      <div className="flex items-center gap-4">
        <div
          className={`w-[16px] h-[16px] rounded-full ${
            online ? "bg-green-500" : "bg-red-500"
          }`}
        />

        <h2 className="text-[20px] font-semibold text-[#555]">
          You are {online ? "Online" : "Offline"}
        </h2>
      </div>

      {/* Toggle */}
      <button
        onClick={handleToggleStatus}
        disabled={loading}
        className={`relative w-[68px] h-[38px] rounded-full transition-all duration-300 cursor-pointer ${
          online ? "bg-green-500" : "bg-[#D9D9E3]"
        } ${loading ? "opacity-80 cursor-wait" : ""}`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-8 h-8 bg-white rounded-full shadow transition-all duration-300 ${
            online ? "translate-x-[30px]" : ""
          }`}
        />
      </button>
    </div>
  );
}