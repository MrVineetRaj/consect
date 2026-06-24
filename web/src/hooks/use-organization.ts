import { authClient } from "@/lib/auth";
import { axiosClient } from "@/lib/axios";
import { AxiosError } from "axios";

export function useOrganizationClient() {
  async function listOrganizationMembers(organizationId:string){
    const res = await authClient.organization.listMembers();


  }
  async function listOrganizations(token: string) {
    try {
      const res = await axiosClient.get("/organization", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { result, message } = res.data as {
        result: IOrganization[];
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
        message: "Failed to load organizations",
      };
    }
  }

  async function createOrganization(
    token: string,
    body: { name: string; logo?: string | null },
  ) {
    try {
      const res = await axiosClient.post("/organization", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { result, message } = res.data as {
        result: IOrganization;
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
        message: "Failed to create organization",
      };
    }
  }

  return { listOrganizations, createOrganization };
}
