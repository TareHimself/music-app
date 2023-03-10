import axios, { AxiosRequestConfig } from "axios";

export const SpotifyApi = axios.create({
  baseURL: "https://api.spotify.com/v1/",
  timeout: 1000,
  headers: { Authorization: "" },
});

SpotifyApi.interceptors.response.use(undefined, async (error) => {
  if (
    !error.response ||
    (error.response.status >= 400 && error.response.status < 429)
  ) {
    const tokenResponse = await axios.get<{
      clientId: string;
      accessToken: string;
      accessTokenExpirationTimestampMs: number;
      isAnonymous: boolean;
    }>(
      "https://open.spotify.com/get_access_token?reason=transport&productType=web_player"
    );

    const config: AxiosRequestConfig = error.config;
    if (!config.headers) config.headers = {};
    config.headers[
      "Authorization"
    ] = `Bearer ${tokenResponse.data.accessToken}`;
    SpotifyApi.defaults.headers["Authorization"] =
      config.headers["Authorization"];
    return axios(config);
  }
  return Promise.reject(error);
});
