import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ADRESS,
});

export const configureInterceptors = (router) => {
  const reqInterceptor = api.interceptors.request.use(
    (config) => {
      const t = sessionStorage.getItem("authToken");
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  const resInterceptor = api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const refresh = sessionStorage.getItem("refreshToken");

      if (
        error.response?.status === 401 &&
        refresh &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        try {
          const resp = await axios.post(
            process.env.NEXT_PUBLIC_API_ADRESS + "/Users/refresh-token",
            {
              refreshToken: refresh,
            }
          );

          sessionStorage.setItem("authToken", resp.data.token);
          sessionStorage.setItem("refreshToken", resp.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${resp.data.token}`;

          return api(originalRequest);
        } catch {
          sessionStorage.clear();
          router.push("/");
        }
      }
      return Promise.reject(error);
    }
  );

  return { reqInterceptor, resInterceptor };
};

export default api;
