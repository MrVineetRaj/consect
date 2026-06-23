import axios from "axios";
import { env } from "./env";

export const axiosClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL + "/api/v1",
  // withCredentials:true
});
