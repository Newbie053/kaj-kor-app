const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.60.154.207:5000";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
export const AUTH_API_BASE_URL = `${API_BASE_URL}/auth`;
