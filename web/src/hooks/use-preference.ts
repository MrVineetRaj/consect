import { axiosClient } from "@/lib/axios";
import { AxiosError } from "axios";
import { toast } from "sonner";

export function usePreferenceClient() {
  async function getUserPreference(token: string) {
    try {
      const res = await axiosClient.get("/user-preference", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { result, message } = res.data as {
        result: IUserPreference;
        message: string;
        code: string;
      };
      return {
        success: true,
        result,
        message,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        // toast.error(error.response?.data?.message);
        return {
          success: false,
          result: null,
          message: error.response?.data?.message,
        };
      }

      //   toast.error("Failed to load user preference");
      return {
        success: false,
        result: null,
        message: "Failed to load user preference",
      };
    }
  }

  async function updateUserPreference(
    token: string,
    body: { organizationId?: string | null },
  ) {
    try {
      const res = await axiosClient.patch("/user-preference", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { result, message } = res.data as {
        result: IUserPreference;
        message: string;
        code: string;
      };
      return {
        success: true,
        result,
        message,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          success: false,
          result: null,
          message: error.response?.data?.message,
        };
      }

      return {
        success: false,
        result: null,
        message: "Failed to update user preference",
      };
    }
  }

  return { getUserPreference, updateUserPreference };
}
