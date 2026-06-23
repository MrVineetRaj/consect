"use client";
import { useUserPreferenceStore } from "@/store/user-preference-store";
import { useUserStore } from "@/store/user-store";
import React, { useEffect } from "react";

export const StoreProvider = ({
  user,
  userPreference,
  token,
  children,
}: Readonly<{
  user: IUser | null;
  userPreference: IUserPreference | null;
  token: string;
  children: React.ReactNode;
}>) => {
  const { setUser } = useUserStore();
  const { setUserPreference } = useUserPreferenceStore();
  useEffect(() => {
    setUser({ user, token });
  }, [user]);

  useEffect(() => {
    setUserPreference({ userPreference });
  }, [userPreference]);
  return <>{children}</>;
};
