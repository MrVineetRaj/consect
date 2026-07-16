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

  async function listWorkspaceMembers({
    token,
    organizationId,
  }: {
    token: string;
    organizationId: string;
  }) {
    const res = await axiosClient.get("/organization/members", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: IWorkspaceMembers;
    };
  }

  async function updateWorkspaceMemberRole({
    token,
    organizationId,
    memberId,
    role,
  }: {
    token: string;
    organizationId: string;
    memberId: string;
    role: "admin" | "member";
  }) {
    const res = await axiosClient.patch(
      "/organization/member/role",
      { memberId, role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-organization-id": organizationId,
        },
      },
    );

    return res.data as { message: string; code: number };
  }

  async function updateWorkspaceMemberAccess({
    token,
    organizationId,
    userId,
    config,
  }: {
    token: string;
    organizationId: string;
    userId: string;
    config: Partial<OrgAccess>;
  }) {
    const res = await axiosClient.patch(
      "/organization/member/access",
      { userId, config },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-organization-id": organizationId,
        },
      },
    );

    return res.data as {
      message: string;
      code: number;
      result: {
        userId: string;
        access: OrgAccess;
        overrides: Partial<OrgAccess>;
      };
    };
  }

  async function removeWorkspaceMember({
    token,
    organizationId,
    memberId,
  }: {
    token: string;
    organizationId: string;
    memberId: string;
  }) {
    const res = await axiosClient.delete("/organization/member", {
      data: { memberId },
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as { message: string; code: number };
  }

  return {
    listOrganizations,
    createOrganization,
    listWorkspaceMembers,
    updateWorkspaceMemberRole,
    updateWorkspaceMemberAccess,
    removeWorkspaceMember,
  };
}
