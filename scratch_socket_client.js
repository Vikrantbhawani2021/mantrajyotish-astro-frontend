import { io } from "socket.io-client";

const SOCKET_URL = "https://kalpjoytish-backend.onrender.com";
console.log("Connecting to socket server:", SOCKET_URL);

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnection: false
});

socket.on("connect", () => {
  console.log("✅ Socket connected successfully! ID:", socket.id);
  socket.disconnect();
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:", err.message);
  process.exit(1);
});

// Force exit after 10 seconds
setTimeout(() => {
  console.log("⏱️ Connection timed out.");
  process.exit(1);
}, 10000);
