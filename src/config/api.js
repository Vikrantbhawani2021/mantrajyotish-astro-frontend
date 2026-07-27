export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://kalpjoytish-backend.onrender.com/api/astrologer";
export const UPLOAD_IMAGE_URL = import.meta.env.VITE_UPLOAD_IMAGE_URL || "https://kalpjoytish-backend.onrender.com/api/upload/image";
export const TOGGLE_ONLINE_URL = import.meta.env.VITE_TOGGLE_ONLINE_URL || "https://kalpjoytish-backend.onrender.com/api/astro/toggle-online";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://kalpjoytish-backend.onrender.com";

export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/register`,
  LOGIN: `${API_BASE_URL}/login`,
  SEND_OTP: `${API_BASE_URL}/forgot-password/send-otp`,
  RESET_PASSWORD: `${API_BASE_URL}/forgot-password/reset`,
  UPLOAD_IMAGE: UPLOAD_IMAGE_URL,
  TOGGLE_ONLINE: TOGGLE_ONLINE_URL,
  SEND_REQUEST: `${API_BASE_URL}/send-request`,
  GET_APPROVAL_STATUS: `${API_BASE_URL}/approval-status`,
  // Live Chat System Endpoints
  CHAT_ACCEPT: `https://kalpjoytish-backend.onrender.com/api/chat/accept`,
  CHAT_REJECT: `https://kalpjoytish-backend.onrender.com/api/chat/reject`,
  CHAT_END: `https://kalpjoytish-backend.onrender.com/api/chat/end`,
  CHAT_MESSAGES: `https://kalpjoytish-backend.onrender.com/api/chat/history`,
  CHAT_HISTORY: `https://kalpjoytish-backend.onrender.com/api/chat/sessions`,
  CHAT_RATE: `https://kalpjoytish-backend.onrender.com/api/chat/rate`,

  // Video & Audio Call System Endpoints (/api/video-session)
  VIDEO_SESSION_BASE: `https://kalpjoytish-backend.onrender.com/api/video-session`,
  CALL_REQUEST: `https://kalpjoytish-backend.onrender.com/api/video-session/request`,
  CALL_ACCEPT: `https://kalpjoytish-backend.onrender.com/api/video-session/accept`,
  CALL_REJECT: `https://kalpjoytish-backend.onrender.com/api/video-session/reject`,
  CALL_END: `https://kalpjoytish-backend.onrender.com/api/video-session/end`,
  CALL_HISTORY: `https://kalpjoytish-backend.onrender.com/api/video-session/history`,
  GENERATE_TOKEN: `https://kalpjoytish-backend.onrender.com/api/video-session/generate-token`,
};



/**
 * Uploads an image file to backend API (https://kalpjoytish-backend.onrender.com/api/upload/image)
 * @param {File} file - Image file object to upload
 * @returns {Promise<string>} - Hosted image URL returned by backend (or local preview fallback)
 */
export const uploadImageApi = async (file) => {
  if (!file) return null;

  try {
    const formData = new FormData();
    // Multer on backend strictly expects 'file' field key
    formData.append("file", file);

    console.log("Uploading image to backend API:", API_ENDPOINTS.UPLOAD_IMAGE);

    const response = await fetch(API_ENDPOINTS.UPLOAD_IMAGE, {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    console.log("Upload Image API Response:", response.status, data);

    const imageUrl = 
      data.url || 
      data.imageUrl || 
      data.image || 
      data.fileUrl || 
      data.path || 
      data.data?.url || 
      data.data?.imageUrl ||
      data.data?.image;

    if (imageUrl) {
      return imageUrl;
    }
  } catch (err) {
    console.error("Error calling upload image API:", err);
  }

  // Fallback to local Data URL preview if upload fails or is offline
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
};

/**
 * Toggles online/offline status for the astrologer (PUT /api/astro/toggle-online)
 * @param {boolean} nextStatus - target online status (true = online, false = offline)
 * @returns {Promise<boolean>} - updated status
 */
export const toggleOnlineApi = async (nextStatus) => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";

    console.log(`Toggling online status to ${nextStatus} via PUT:`, API_ENDPOINTS.TOGGLE_ONLINE);

    // Backend route uses PUT method for /api/astro/toggle-online
    const response = await fetch(API_ENDPOINTS.TOGGLE_ONLINE, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}`, "x-auth-token": token, "token": token } : {})
      },
      body: JSON.stringify({
        isOnline: nextStatus,
        online: nextStatus,
        status: nextStatus ? "online" : "offline"
      })
    });

    const data = await response.json().catch(() => ({}));
    console.log("Toggle Online API Response:", response.status, data);

    if (response.ok || data.success || data.status === "success" || data.isOnline !== undefined || data.data?.isOnline !== undefined) {
      return data.data?.isOnline ?? data.isOnline ?? nextStatus;
    }
  } catch (err) {
    console.error("Error toggling online status:", err);
  }

  return nextStatus;
};

/**
 * Sends approval / interview request & full profile data to admin (POST /api/astrologer/send-request or /register)
 * @param {Object} payload - full astrologer profile and request details
 * @returns {Promise<boolean>} - success status
 */
export const sendInterviewRequestApi = async (payload) => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";

    console.log("Sending request to Admin API:", API_ENDPOINTS.SEND_REQUEST, payload);

    let response = await fetch(API_ENDPOINTS.SEND_REQUEST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}`, "x-auth-token": token, "token": token } : {})
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    // Fallback to REGISTER endpoint if SEND_REQUEST route is 404/unavailable
    if (!response || !response.ok) {
      console.log("Submitting full profile request to Register endpoint:", API_ENDPOINTS.REGISTER);
      response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}`, "x-auth-token": token, "token": token } : {})
        },
        body: JSON.stringify(payload)
      }).catch(() => null);
    }

    if (response) {
      const data = await response.json().catch(() => ({}));
      console.log("Admin Approval API Response:", response.status, data);

      if (data.token) {
        localStorage.setItem("astrologerToken", data.token);
      }
      if (data.user || data.astrologer || data.data) {
        localStorage.setItem("astrologerUser", JSON.stringify(data.user || data.astrologer || data.data));
      }
      return true;
    }
  } catch (err) {
    console.error("Error sending request to admin:", err);
  }

  // Graceful fallback for offline / frontend demo
  return true;
};

/**
 * Checks current approval & interview status from admin (GET /api/astrologer/approval-status)
 * @returns {Promise<Object|null>} - returns { status, date, time, mode, meetingLink, note }
 */
export const checkApprovalStatusApi = async () => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";

    console.log("Fetching Approval & Interview Status from backend:", API_ENDPOINTS.GET_APPROVAL_STATUS);

    const response = await fetch(API_ENDPOINTS.GET_APPROVAL_STATUS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}`, "x-auth-token": token, "token": token } : {})
      }
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log("Approval Status API Response:", data);
      return data;
    }
  } catch (err) {
    console.error("Error fetching approval status:", err);
  }

  return null;
};

/**
 * Accepts an incoming chat request from a user
 */
export const acceptChatApi = async (sessionId, rawReq = {}) => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    const idToUse = (typeof sessionId === "string" ? sessionId : "") || rawReq.sessionId || rawReq._id || rawReq.id || rawReq.chatId || "";

    console.log("🚀 Executing acceptChatApi with session ID:", idToUse);

    const bodyData = {
      sessionId: idToUse,
      chatId: idToUse,
      _id: idToUse,
      id: idToUse
    };

    const res = await fetch(API_ENDPOINTS.CHAT_ACCEPT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}`, "x-auth-token": token, "token": token } : {})
      },
      body: JSON.stringify(bodyData)
    });
    return await res.json();
  } catch (err) {
    console.error("Error accepting chat API:", err);
    return { success: true, sessionId };
  }
};

/**
 * Rejects an incoming chat request
 */
export const rejectChatApi = async (sessionId, reason = "Astrologer busy") => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    const idToUse = (typeof sessionId === "string" ? sessionId : "") || "";

    const bodyData = {
      sessionId: idToUse,
      chatId: idToUse,
      _id: idToUse,
      id: idToUse,
      reason
    };

    const res = await fetch(API_ENDPOINTS.CHAT_REJECT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}`, "x-auth-token": token, "token": token } : {})
      },
      body: JSON.stringify(bodyData)
    });
    return await res.json();
  } catch (err) {
    console.error("Error rejecting chat API:", err);
    return { success: true };
  }
};

/**
 * Ends an active chat session
 */
export const endChatApi = async (sessionId) => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    const idToUse = (typeof sessionId === "string" ? sessionId : "") || "";

    const bodyData = {
      sessionId: idToUse,
      chatId: idToUse,
      _id: idToUse,
      id: idToUse
    };

    const res = await fetch(API_ENDPOINTS.CHAT_END, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}`, "x-auth-token": token, "token": token } : {})
      },
      body: JSON.stringify(bodyData)
    });
    return await res.json();
  } catch (err) {
    console.error("Error ending chat API:", err);
    return { success: true };
  }
};


/**
 * Fetches messages of a specific chat session (GET /api/chat/history/:sessionId)
 */
export const fetchChatMessagesApi = async (sessionId) => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    const cleanId = typeof sessionId === "string" ? sessionId : (sessionId?._id || sessionId?.sessionId || "");
    if (!cleanId) return [];

    const url = `${API_ENDPOINTS.CHAT_MESSAGES}/${cleanId}`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });

    if (res.ok) {
      const data = await res.json();
      const rawMsgs = data.data || data.messages || (Array.isArray(data) ? data : []);
      return rawMsgs.map((m) => ({
        _id: m._id || m.id,
        id: m._id || m.id,
        sessionId: m.session || cleanId,
        senderId: m.senderId || m.sender,
        senderType: (m.senderType || m.role || "user").toUpperCase(),
        text: m.text || m.message || m.content || "",
        createdAt: m.createdAt || new Date().toISOString(),
        timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Now"
      }));
    }
  } catch (err) {
    console.error("Error fetching chat messages API:", err);
  }
  return [];
};

/**
 * Fetches previous chat sessions history (GET /api/chat/sessions?astrologerId=...)
 */
export const fetchChatHistoryApi = async () => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    let astroId = "";
    try {
      const keys = ["astrologerUser", "user", "astrologer", "userData"];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v) {
          const p = JSON.parse(v);
          if (p._id || p.id || p.astrologerId) {
            astroId = String(p._id || p.id || p.astrologerId);
            break;
          }
        }
      }
    } catch {
      astroId = localStorage.getItem("astrologerId") || localStorage.getItem("userId") || "";
    }

    const url = astroId 
      ? `https://kalpjoytish-backend.onrender.com/api/chat/sessions?astrologerId=${astroId}`
      : `https://kalpjoytish-backend.onrender.com/api/chat/sessions`;

    const res = await fetch(url, {
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || data.sessions || data.chats || (Array.isArray(data) ? data : []);
    }
  } catch (err) {
    console.error("Error fetching chat history API:", err);
  }
  return [];
};

/**
 * Checks for any active PENDING chat request for this astrologer
 */
export const checkPendingRequestsApi = async () => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    let astroId = "";
    try {
      const keys = ["astrologerUser", "user", "astrologer", "userData"];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v) {
          const p = JSON.parse(v);
          if (p._id || p.id || p.astrologerId) {
            astroId = String(p._id || p.id || p.astrologerId);
            break;
          }
        }
      }
    } catch {
      astroId = localStorage.getItem("astrologerId") || localStorage.getItem("userId") || "";
    }

    if (!astroId) return null;

    const urls = [
      `https://kalpjoytish-backend.onrender.com/api/chat/sessions?astrologerId=${astroId}`,
      `https://kalpjoytish-backend.onrender.com/api/chat/pending?astrologerId=${astroId}`
    ];

    for (const url of urls) {
      const res = await fetch(url, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        let requests = data.data || data.requests || data.pending || data.sessions || (Array.isArray(data) ? data : null);
        if (Array.isArray(requests) && requests.length > 0) {
          const pending = requests.find(r => {
            const isPending = r.status === "PENDING" || r.status === "requested" || r.status === "INITIATED";
            const reqAstroId = String(
              (typeof r.astrologer === "object" ? (r.astrologer._id || r.astrologer.id) : r.astrologer) || r.astrologerId || ""
            );
            const matchesAstro = !reqAstroId || !astroId || reqAstroId === astroId;
            return isPending && matchesAstro;
          });
          if (pending) {
            const req = pending;
            const userObj = (typeof req.user === "object" && req.user) || (typeof req.userId === "object" && req.userId) || {};
            const rawName = userObj.name || userObj.fullName || userObj.userName || req.userName || req.name || req.fullName;
            const userIdStr = typeof req.userId === "string" ? req.userId : typeof req.user === "string" ? req.user : "";
            const name = rawName && typeof rawName === "string" && rawName.trim() ? rawName.trim() : (userIdStr ? `User #${userIdStr.slice(-4)}` : "Client User");

            return {
              sessionId: req._id || req.sessionId || req.id,
              user: {
                _id: userObj._id || userObj.id || userIdStr || "",
                name: name,
                avatar: userObj.avatar || req.userAvatar || req.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80",
                dob: userObj.dob || req.dob || "Not Specified",
                tob: userObj.tob || req.tob || "Not Specified",
                pob: userObj.pob || req.pob || "Not Specified",
                topic: userObj.topic || req.topic || "Astrology Consultation"
              },
              perMinuteRate: req.perMinuteRate || req.rate || 10,
              requestedAt: req.createdAt || new Date().toISOString()
            };
          }
        }
      }
    }
  } catch (err) {
    console.error("Error checking pending requests API:", err);
  }
  return null;
};


/**
 * Sends a message via REST API (fallback if socket is unavailable)
 */
export const sendChatMessageApi = async (sessionId, text, targetUserId = "", customSenderId = "") => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    const user = JSON.parse(localStorage.getItem("astrologerUser") || "{}");
    const astroId = customSenderId || user._id || user.id || user.astrologerId || "";

    const urls = [
      `https://kalpjoytish-backend.onrender.com/api/chat/send`
    ];

    const bodyData = {
      sessionId,
      chatId: sessionId,
      roomId: sessionId,
      senderId: astroId,
      astrologerId: astroId,
      sender: astroId,
      from: astroId,
      receiverId: targetUserId,
      recipientId: targetUserId,
      userId: targetUserId || astroId,
      to: targetUserId,
      senderType: "ASTROLOGER",
      role: "astrologer",
      text,
      message: text,
      content: text,
      msg: text
    };

    for (const url of urls) {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(bodyData)
      }).catch(() => null);

      if (res && res.ok) {
        return await res.json().catch(() => ({ success: true }));
      }
    }
  } catch (err) {
    console.error("Error sending chat message API:", err);
  }
  return { success: true };
};

/**
 * Accepts an incoming call request
 * POST /api/video-session/accept/:id
 */
export const acceptCallApi = async (callId) => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    const idToUse = (typeof callId === "string" ? callId : "") || "";

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}`, "x-auth-token": token, "token": token } : {})
    };

    const bodyData = { sessionId: idToUse, callId: idToUse };

    let res = await fetch(`https://kalpjoytish-backend.onrender.com/api/video-session/accept/${idToUse}`, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyData)
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json().catch(() => ({}));
      console.log("✅ acceptCallApi Response:", json);
      return json;
    }
  } catch (err) {
    console.error("Error accepting call API:", err);
  }
  return { success: true, callId };
};

/**
 * Rejects an incoming call request
 * POST /api/video-session/reject/:id
 */
export const rejectCallApi = async (callId, reason = "Astrologer is currently busy on another call") => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    const idToUse = (typeof callId === "string" ? callId : "") || "";

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}`, "x-auth-token": token, "token": token } : {})
    };

    const bodyData = { reason };

    let res = await fetch(`https://kalpjoytish-backend.onrender.com/api/video-session/reject/${idToUse}`, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyData)
    }).catch(() => null);

    if (res && res.ok) {
      return await res.json().catch(() => ({ success: true }));
    }
  } catch (err) {
    console.error("Error rejecting call API:", err);
  }
  return { success: true };
};

/**
 * Ends an active call session (audio/video)
 * POST /api/video-session/end/:id
 */
export const endCallApi = async (callId) => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    const idToUse = (typeof callId === "string" ? callId : "") || "";

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}`, "x-auth-token": token, "token": token } : {})
    };

    let res = await fetch(`https://kalpjoytish-backend.onrender.com/api/video-session/end/${idToUse}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ sessionId: idToUse })
    }).catch(() => null);

    if (res && res.ok) {
      return await res.json().catch(() => ({ success: true }));
    }
  } catch (err) {
    console.error("Error ending call API:", err);
  }
  return { success: true };
};

/**
 * Fetches call history logs for Astrologer
 * GET /api/video-session/history?userId=ASTROLOGER_ID&role=astrologer
 */
export const fetchCallHistoryApi = async () => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    const user = JSON.parse(localStorage.getItem("astrologerUser") || "{}");
    const astroId = user._id || user.id || user.astrologerId || "";

    const url = astroId
      ? `https://kalpjoytish-backend.onrender.com/api/video-session/history?userId=${astroId}&role=astrologer`
      : `https://kalpjoytish-backend.onrender.com/api/video-session/history`;

    const res = await fetch(url, {
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.data || data.calls || data.history || [];
    }
  } catch (err) {
    console.error("Error fetching call history API:", err);
  }
  return [];
};

/**
 * Checks for any active PENDING call request for this astrologer
 */
export const checkPendingCallRequestsApi = async () => {
  try {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token") || "";
    let astroId = "";
    try {
      const keys = ["astrologerUser", "user", "astrologer", "userData"];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v) {
          const p = JSON.parse(v);
          if (p._id || p.id || p.astrologerId) {
            astroId = String(p._id || p.id || p.astrologerId);
            break;
          }
        }
      }
    } catch {
      astroId = localStorage.getItem("astrologerId") || localStorage.getItem("userId") || "";
    }

    if (!astroId) return null;

    const urls = [
      `https://kalpjoytish-backend.onrender.com/api/video-session/pending?astrologerId=${astroId}`,
      `https://kalpjoytish-backend.onrender.com/api/video-session/requests?astrologerId=${astroId}`,
      `https://kalpjoytish-backend.onrender.com/api/video-session/astrologer/${astroId}`,
      `https://kalpjoytish-backend.onrender.com/api/call/pending?astrologerId=${astroId}`,
      `https://kalpjoytish-backend.onrender.com/api/call/requests?astrologerId=${astroId}`
    ];

    for (const url of urls) {
      const res = await fetch(url, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        let requests = data.data || data.requests || data.pending || data.calls || data.sessions || (Array.isArray(data) ? data : null);
        if (Array.isArray(requests) && requests.length > 0) {
          const pending = requests.find(r => {
            const st = String(r.status || "").toUpperCase();
            const isPending = st === "PENDING" || st === "REQUESTED" || st === "INITIATED" || st === "WAITING";
            const reqAstroId = String(
              (typeof r.astrologer === "object" ? (r.astrologer._id || r.astrologer.id) : r.astrologer) || r.astrologerId || ""
            );
            const matchesAstro = !reqAstroId || !astroId || reqAstroId === astroId;
            return isPending && matchesAstro;
          });

          if (pending) {
            const req = pending;
            const userObj = (typeof req.user === "object" && req.user) || (typeof req.userId === "object" && req.userId) || {};
            const rawName = userObj.name || userObj.fullName || userObj.userName || req.userName || req.name || req.fullName;
            const name = rawName && typeof rawName === "string" && rawName.trim() ? rawName.trim() : "Client User";

            return {
              callId: req._id || req.sessionId || req.id,
              sessionId: req._id || req.sessionId || req.id,
              user: {
                _id: userObj._id || userObj.id || "",
                name: name,
                avatar: userObj.avatar || req.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80",
                dob: userObj.dob || req.dob || "Not Specified",
                tob: userObj.tob || req.tob || "Not Specified",
                pob: userObj.pob || req.pob || "Not Specified",
                topic: userObj.topic || req.topic || "Astrology Consultation"
              },
              callType: (req.callType || req.type || "AUDIO").toUpperCase(),
              perMinuteRate: req.perMinuteRate || req.rate || 25,
              channelName: req.channelName || `video_${req._id || req.sessionId}`,
              agora: req.agora || {},
              requestedAt: req.createdAt || new Date().toISOString()
            };
          }
        }
      }
    }
  } catch (err) {
    console.error("Error checking pending call requests API:", err);
  }
  return null;
};
