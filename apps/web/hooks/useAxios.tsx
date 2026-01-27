"use client";

import axios, { AxiosRequestConfig } from "axios";
import { useState } from "react";

export default function useAxios() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const request = async (config: AxiosRequestConfig) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios({
        withCredentials: true,
        ...config,
      });

      setData(response.data);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    get: (url: string) => request({ url, method: "GET" }),
    post: (url: string, body?: any) =>
      request({ url, method: "POST", data: body }),
  };
}
