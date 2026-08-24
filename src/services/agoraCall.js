import AgoraRTC from "agora-rtc-sdk-ng";
AgoraRTC.setLogLevel(3);

// Agora RTC Client Singleton Instance
let rtcClient = null;
let localAudioTrack = null;
let localVideoTrack = null;

let isMicMuted = false;
let isCameraOff = false;

// Event callbacks object
const callEvents = {
  onRemoteUserJoined: null,
  onRemoteUserLeft: null,
  onRemoteTrackPublished: null,
  onError: null,
};

/**
 * Initializes and joins an Agora RTC Channel for Audio or Video calls
 */
export const joinAgoraCallChannel = async ({
  appId,
  channelName,
  token = null,
  uid = null,
  callType = "AUDIO",
  callbacks = {}
}) => {
  try {
    const finalAppId = appId || import.meta.env.VITE_AGORA_APP_ID || "demo_app_id";
    console.log(`🎥 Initializing Agora RTC (${callType}) for channel:`, channelName, "AppID:", finalAppId);

    // Store callbacks
    callEvents.onRemoteUserJoined = callbacks.onRemoteUserJoined || null;
    callEvents.onRemoteUserLeft = callbacks.onRemoteUserLeft || null;
    callEvents.onRemoteTrackPublished = callbacks.onRemoteTrackPublished || null;
    callEvents.onError = callbacks.onError || null;

    // Reset mute flags
    isMicMuted = false;
    isCameraOff = false;

    // Create client instance if not exists
    if (!rtcClient) {
      rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    } else {
      // Remove previous listeners to prevent duplicates
      rtcClient.removeAllListeners("user-published");
      rtcClient.removeAllListeners("user-unpublished");
      rtcClient.removeAllListeners("user-left");
      rtcClient.removeAllListeners("user-joined");
    }

    const client = rtcClient;

    // Handle Safari/Mobile Autoplay restrictions
    AgoraRTC.onAutoplayFailed = () => {
      console.warn("Autoplay blocked by browser. User must click to resume audio.");
      alert("Browser blocked audio. Please click anywhere on the page to hear the call.");
    };

    // Register Remote Event Listeners
    client.on("user-published", async (user, mediaType) => {
      console.log("👤 Remote user published track:", user.uid, mediaType);
      if (client) {
        await client.subscribe(user, mediaType);
      }

      if (mediaType === "audio") {
        try {
          user.audioTrack?.play();
        } catch (e) {
          console.error("Audio playback error:", e);
        }
      }

      if (callEvents.onRemoteTrackPublished) {
        callEvents.onRemoteTrackPublished(user, mediaType);
      }
    });

    client.on("user-left", (user, reason) => {
      console.log("👋 Remote user left channel:", user.uid, reason);
      if (callEvents.onRemoteUserLeft) {
        callEvents.onRemoteUserLeft(user, reason);
      }
    });

    client.on("user-joined", (user) => {
      console.log("🤝 Remote user joined channel:", user.uid);
      if (callEvents.onRemoteUserJoined) {
        callEvents.onRemoteUserJoined(user);
      }
    });

    // Join Channel — pass null for mock/empty tokens (enables Agora App-ID-only test mode)
    const resolvedToken = (token && !String(token).startsWith("mock_")) ? token : null;
    const joinedUid = await client.join(
      finalAppId,
      channelName,
      resolvedToken,
      uid || Math.floor(Math.random() * 10000)
    );
    console.log("✅ Successfully joined Agora RTC channel with UID:", joinedUid);

    // Create Local Tracks based on callType
    if (callType === "VIDEO") {
      try {
        [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: "speech_standard" },
          { 
            encoderConfig: "720p_1",
            facingMode: "user"
          }
        );
        await client.publish([localAudioTrack, localVideoTrack]);
        console.log("📹 Local Microphone & Camera tracks published!");
      } catch (mediaErr) {
        console.warn("⚠️ Camera/Mic error, trying Audio track fallback:", mediaErr);
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
      }
    } else {
      // Audio Call Only
      localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: "speech_standard" });
      await client.publish([localAudioTrack]);
      console.log("🎙️ Local Microphone Audio track published!");
    }

    return {
      uid: joinedUid,
      localAudioTrack,
      localVideoTrack,
      client: rtcClient
    };

  } catch (err) {
    console.error("❌ Failed to join Agora RTC Channel:", err);
    if (callEvents.onError) {
      callEvents.onError(err);
    }
    // Return graceful fallback state so UI doesn't crash if demo AppID is invalid
    return {
      uid: uid || 1234,
      localAudioTrack: null,
      localVideoTrack: null,
      isDemoFallback: true
    };
  }
};

/**
 * Plays local video track inside a DOM container element or ref
 */
export const playLocalVideoTrack = (domElement) => {
  if (localVideoTrack && domElement) {
    try {
      localVideoTrack.play(domElement);
      console.log("▶️ Playing local video track in element");
    } catch (err) {
      console.error("Error playing local video track:", err);
    }
  }
};

/**
 * Plays remote user video track inside a DOM container element or ref
 */
export const playRemoteVideoTrack = (remoteUser, domElement) => {
  if (remoteUser && remoteUser.videoTrack && domElement) {
    try {
      remoteUser.videoTrack.play(domElement);
      console.log("▶️ Playing remote video track for user:", remoteUser.uid);
    } catch (err) {
      console.error("Error playing remote video track:", err);
    }
  }
};

/**
 * Toggles Microphone Mute / Unmute
 */
export const toggleMicrophoneMute = async () => {
  if (localAudioTrack) {
    isMicMuted = !isMicMuted;
    await localAudioTrack.setEnabled(!isMicMuted);
    console.log(`🎙️ Microphone ${isMicMuted ? "MUTED" : "UNMUTED"}`);
    return isMicMuted;
  }
  return false;
};

/**
 * Toggles Camera Video On / Off
 */
export const toggleCameraState = async () => {
  if (localVideoTrack) {
    isCameraOff = !isCameraOff;
    await localVideoTrack.setEnabled(!isCameraOff);
    console.log(`📹 Camera ${isCameraOff ? "DISABLED" : "ENABLED"}`);
    return isCameraOff;
  }
  return false;
};

/**
 * Leaves Agora RTC channel and releases local tracks
 */
export const leaveAgoraCallChannel = async () => {
  try {
    console.log("🔴 Leaving Agora RTC Channel...");

    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
      localAudioTrack = null;
    }

    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
      localVideoTrack = null;
    }

    if (rtcClient) {
      rtcClient.removeAllListeners();
      await rtcClient.leave().catch(() => null);
      rtcClient = null;
    }

    console.log("✅ Successfully left Agora channel and destroyed tracks.");
  } catch (err) {
    console.error("Error leaving Agora channel:", err);
  }
};

/**
 * Switch current local microphone device
 */
export const switchMicrophone = async (deviceId) => {
  if (localAudioTrack) {
    await localAudioTrack.setDevice(deviceId);
    console.log(`🎙️ Switched microphone to: ${deviceId}`);
    return true;
  }
  return false;
};
/**
 * Switch current local camera device
 */
export const switchCamera = async (deviceId) => {
  if (localVideoTrack) {
    await localVideoTrack.setDevice(deviceId);
    console.log(`📹 Switched camera to: ${deviceId}`);
    return true;
  }
  return false;
};
/**
 * Retrieve active audio and video tracks
 */
export const getLocalTracks = () => {
  return {
    localAudioTrack,
    localVideoTrack
  };
};
