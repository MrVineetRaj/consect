"use client";
import { icons } from "@/lib/assets";
import { useOrganizationStore } from "@/store/organization-store";
import { useUserPreferenceStore } from "@/store/user-preference-store";
import { useUserStore } from "@/store/user-store";
import React, { useEffect } from "react";

export const StoreProvider = ({
  user,
  userPreference,
  token,
  children,
  orgMembers,
}: Readonly<{
  user: IUser | null;
  userPreference: IUserPreference | null;
  token: string;
  orgMembers: IOrganizationMembers[];
  children: React.ReactNode;
}>) => {
  const { setUser } = useUserStore();
  const { setUserPreference } = useUserPreferenceStore();
  const { setOrganizationMembers } = useOrganizationStore();
  useEffect(() => {
    setUser({ user, token });
  }, [user]);

  useEffect(() => {
    setUserPreference({ userPreference });
  }, [userPreference]);

  useEffect(() => {
    setOrganizationMembers(orgMembers);
  }, [orgMembers]);
  return <>{children}</>;
};
