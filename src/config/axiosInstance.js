import axios from "axios";

/**
 * Production Centralized Axios Instance for Astrologer Frontend.
 * Reads base URL purely from VITE_SOCKET_URL / VITE_API_BASE_URL environment variable.
 */
const baseURL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000
});

// Request Interceptor: Automatically attach Bearer token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("astrologerToken") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global response handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API call detected (401). Token might be expired.");
    }
    return Promise.reject(error);
  }
);

export default api;
