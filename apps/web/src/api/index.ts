import axios from "axios";
import { baseUrl } from "./constants";
import { getToken, saveToken } from "@/utils/storageToken";

export * from "./auth";

export const httpClient = axios.create({
  baseURL: baseUrl,
});

httpClient.interceptors.request.use((config) => {
  // Do something before request is sent
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      saveToken({ token: "" });
      const url = new URL(`${window.location.origin}/auth/signin`);

      window.location.replace(url.href);
    }

    return Promise.reject(error);
  },
);
