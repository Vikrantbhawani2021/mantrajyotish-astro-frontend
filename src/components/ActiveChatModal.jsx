import { useState, useEffect, useRef } from "react";
import { Send, PhoneOff, Clock, User, ChevronDown, ChevronUp, Image, AlertTriangle, ShieldAlert, CheckCheck } from "lucide-react";
import { sendChatMessage, emitTyping, endChatSession, subscribeSocketEvent, joinChatRoom, acceptChatRequest } from "../services/socket";
import { endChatApi, fetchChatMessagesApi, sendChatMessageApi } from "../config/api";


export default function ActiveChatModal({ session, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [showKundliDetails, setShowKundliDetails] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [walletWarning, setWalletWarning] = useState(null);
  const messagesEndRef = useRef(null);

  const astroUser = JSON.parse(localStorage.getItem("astrologerUser") || "{}");
  const astroId = astroUser._id || astroUser.id || astroUser.astrologerId || session?.astrologerId || session?.astrologer || "";

  const sessionId = session?.sessionId || session?._id || session?.id || session?.chatId || "";
  const user = session?.user || {};
  const perMinuteRate = Number(session?.perMinuteRate || session?.rate || session?.price || session?.charge || user?.perMinuteRate || user?.rate || 20) || 20;


  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isUserTyping]);

  // Initial messages load & Session timer
  useEffect(() => {
    let timer;
    if (sessionId) {
      // 1. Join chat room on Socket.io and emit accept_chat_request
      joinChatRoom(sessionId);
      acceptChatRequest(sessionId);

      // 2. Load initial chat messages if any
      fetchChatMessagesApi(sessionId).then((existingMsgs) => {
        if (existingMsgs && existingMsgs.length > 0) {
          setMessages(existingMsgs);
        } else {
          // Default initial greeting message from system
          setMessages([
            {
              id: "sys_1",
              senderType: "SYSTEM",
              text: `Chat Session Started with ${user?.name || "Client User"}. Per-minute rate: ₹${perMinuteRate}/min.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      });

      // Start local duration counter
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }

    // Subscribe to Socket events
    const unsubMsg = subscribeSocketEvent("receiveMessage", (msg) => {
      if (!msg) return;
      console.log("📩 New Message Received in Active Chat:", msg);
      
      const normalizedMsg = {
        _id: msg._id || msg.id || "msg_" + Date.now(),
        id: msg._id || msg.id || "msg_" + Date.now(),
        sessionId: msg.sessionId || msg.chatId || sessionId,
        senderId: msg.senderId || msg.sender,
        senderType: (msg.senderType || msg.role || "user").toUpperCase(),
        text: msg.text || msg.message || msg.content || "",
        message: msg.text || msg.message || msg.content || "",
        content: msg.text || msg.message || msg.content || "",
        createdAt: msg.createdAt || new Date().toISOString(),
        timestamp: msg.timestamp || (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      };

      setMessages((prev) => {
        try {
          if (!Array.isArray(prev)) return [normalizedMsg];
          const msgId = String(normalizedMsg._id || normalizedMsg.id || "");
          const msgText = (normalizedMsg.text || "").toString().trim();
          const normSender = (normalizedMsg.senderType || "").toUpperCase();

          // 1. Avoid duplicate by ID
          if (msgId && prev.some((m) => m && String(m._id || m.id || "") === msgId)) return prev;

          // 2. Deduplicate by matching senderType & exact text
          const matchIndex = prev.findIndex(
            (m) =>
              m &&
              String(m.senderType || m.role || "").toUpperCase() === normSender &&
              (m.text || m.message || "").toString().trim() === msgText
          );

          if (matchIndex !== -1) {
            const updated = [...prev];
            updated[matchIndex] = normalizedMsg;
            return updated;
          }

          return [...prev, normalizedMsg];
        } catch (e) {
          console.error("Error parsing receiveMessage socket callback:", e);
          return prev;
        }
      });
    });

    const unsubTimer = subscribeSocketEvent("timerTick", (data) => {
      if (data?.elapsedSeconds !== undefined) {
        setSecondsElapsed(data.elapsedSeconds);
      } else if (data?.elapsedMinutes !== undefined) {
        setSecondsElapsed(data.elapsedMinutes * 60);
      }
    });

    const unsubWarning = subscribeSocketEvent("walletWarning", (data) => {
      setWalletWarning(data?.message || "User's wallet balance is running low!");
    });

    const unsubEnded = subscribeSocketEvent("chatEnded", (data) => {
      console.log("🔴 Chat Session Ended Event Received - Closing modal immediately:", data);
      onClose();
    });

    // Fallback status & message polling (polls backend every 2.5s to check status and sync chat history)
    const statusChecker = setInterval(async () => {
      if (sessionId) {
        // Sync latest messages from DB safely without duplicating
        fetchChatMessagesApi(sessionId).then((existingMsgs) => {
          if (existingMsgs && existingMsgs.length > 0) {
            setMessages((prev) => {
              if (!Array.isArray(prev) || prev.length === 0) return existingMsgs;
              let updated = [...prev];
              let hasChanges = false;

              for (const m of existingMsgs) {
                if (!m) continue;
                const mId = String(m._id || m.id || "");
                const mText = (m.text || m.message || "").toString().trim();
                const mSender = String(m.senderType || "").toUpperCase();

                const existsById = updated.some((p) => String(p._id || p.id || "") === mId);
                if (existsById) continue;

                const matchIdx = updated.findIndex(
                  (p) =>
                    String(p.senderType || p.role || "").toUpperCase() === mSender &&
                    (p.text || p.message || "").toString().trim() === mText
                );

                if (matchIdx !== -1) {
                  updated[matchIdx] = m;
                  hasChanges = true;
                } else {
                  updated.push(m);
                  hasChanges = true;
                }
              }

              return hasChanges ? updated : prev;
            });
          }
        });

        try {
          const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
          const urls = [
            `https://kalpjoytish-backend.onrender.com/api/chat/details/${sessionId}`
          ];

          for (const url of urls) {
            const res = await fetch(url, {
              headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
              }
            }).catch(() => null);

            if (res && res.ok) {
              const data = await res.json().catch(() => null);
              const status = data?.status || data?.session?.status || data?.data?.status;
              const isActive = data?.isActive ?? data?.session?.isActive;

              if (status === "COMPLETED" || status === "ENDED" || status === "REJECTED" || status === "CLOSED" || isActive === false) {
                console.log("🔴 Session status marked ended on backend - Closing modal immediately");
                onClose();
                break;
              }
            }
          }
        } catch (err) {
          // ignore error
        }
      }
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(statusChecker);
      unsubMsg();
      unsubTimer();
      unsubWarning();
      unsubEnded();
    };
  }, [sessionId]);


  const targetUserId = user?._id || user?.id || session?.userId || (typeof session?.user === "string" ? session.user : "") || "";

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const text = inputMessage.trim();
    const newMsg = {
      id: "msg_" + Date.now(),
      sessionId,
      chatId: sessionId,
      roomId: sessionId,
      senderId: astroId,
      astrologerId: astroId,
      sender: astroId,
      receiverId: targetUserId,
      recipientId: targetUserId,
      userId: targetUserId || astroId,
      to: targetUserId,
      senderType: "ASTROLOGER",
      role: "astrologer",
      text: text,
      message: text,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update local state immediately
    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");

    // 1. Send via Socket.io
    sendChatMessage(newMsg);

    // 2. Only call REST API fallback IF socket is disconnected
    try {
      const s = connectSocket();
      if (!s || !s.connected) {
        sendChatMessageApi(sessionId, text, targetUserId, astroId);
      }
    } catch {
      // ignore
    }

    emitTyping(sessionId, false);
  };




  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    emitTyping(sessionId, e.target.value.length > 0);
  };

  const handleEndChat = async () => {
    if (window.confirm("Are you sure you want to end this chat session?")) {
      try {
        await endChatApi(sessionId);
        endChatSession(sessionId);
      } catch (err) {
        console.error("Error ending chat:", err);
      } finally {
        onClose();
      }
    }
  };

  // Format MM:SS
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate current earnings
  const elapsedMinutes = Math.max(1, Math.ceil(secondsElapsed / 60));
  const currentEarnings = (elapsedMinutes * perMinuteRate).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[430px] h-screen bg-[#F4F5FB] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ff8f6c] to-[#ff5c33] text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80"}
                alt={user?.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-white/80"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[16px] leading-tight truncate">{user?.name || "Client User"}</h3>
              <p className="text-xs text-orange-100 font-medium flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Rate: ₹{perMinuteRate}/min
              </p>
            </div>
          </div>

          {/* Earnings Counter & End Button */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="bg-black/20 text-yellow-300 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide border border-white/20">
                ⏱️ {formatTimer(secondsElapsed)}
              </div>
              <p className="text-[11px] text-white/90 font-bold mt-0.5">
                ₹{currentEarnings}
              </p>
            </div>

            <button
              onClick={handleEndChat}
              className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer"
              title="End Chat"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable User Kundli Details */}
        <div className="bg-white border-b border-gray-200 text-xs shadow-sm">
          <button
            onClick={() => setShowKundliDetails(!showKundliDetails)}
            className="w-full px-4 py-2 flex items-center justify-between text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-1.5 text-[#ff7448]">
              <User className="w-3.5 h-3.5" /> Customer Birth & Kundli Details
            </span>
            {showKundliDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showKundliDetails && (
            <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-gray-600 border-t border-gray-100 pt-2 bg-orange-50/40">
              <div><span className="font-semibold">DOB:</span> {user?.dob || "Not Specified"}</div>
              <div><span className="font-semibold">TOB:</span> {user?.tob || "Not Specified"}</div>
              <div><span className="font-semibold">POB:</span> {user?.pob || "Not Specified"}</div>
              <div><span className="font-semibold">Gender:</span> {user?.gender || "Not Specified"}</div>
              {user?.topic && (
                <div className="col-span-2 text-orange-700 font-semibold">
                  <span>Topic:</span> {user.topic}
                </div>
              )}
            </div>
          )}
        </div>


        {/* Low Wallet Warning Banner */}
        {walletWarning && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 font-semibold flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{walletWarning}</span>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((msg, i) => {
            if (msg.senderType === "SYSTEM") {
              return (
                <div key={i} className="self-center my-1 bg-gray-200/80 text-gray-700 text-[11px] font-semibold px-3 py-1 rounded-full text-center max-w-[85%]">
                  {msg.text}
                </div>
              );
            }

            const typeUpper = String(msg.senderType || msg.role || "").toUpperCase();
            const isMe = typeUpper === "ASTROLOGER" || typeUpper === "ASTRO" || (msg.senderId && String(msg.senderId) === String(astroId));


            return (
              <div
                key={i}
                className={`flex flex-col max-w-[78%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
              >
                <div
                  className={`px-4 py-2.5 rounded-[20px] text-sm shadow-sm leading-relaxed ${
                    isMe
                      ? "bg-gradient-to-r from-[#ff7448] to-[#ff5c33] text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                  }`}
                >
                  {msg.text || msg.message || msg.content}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {msg.timestamp || "Now"}
                  </span>
                  {isMe && (
                    <CheckCheck className={`w-3.5 h-3.5 ${msg.isRead ? "text-blue-500 font-bold" : "text-gray-300"}`} />
                  )}
                </div>
              </div>
            );
          })}


          {isUserTyping && (
            <div className="self-start bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full italic animate-pulse">
              User is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Message Input Bar */}
        <div className="bg-white p-3 border-t border-gray-100 flex items-center gap-2 shadow-lg">
          <button className="text-gray-400 hover:text-[#ff7448] p-2 transition-colors cursor-pointer">
            <Image className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message here..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7448]/30 font-medium text-gray-800"
          />

          <button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className="bg-gradient-to-r from-[#ff7448] to-[#ff5c33] hover:opacity-90 disabled:opacity-40 text-white p-2.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
