"use client";
import { useUserStore } from "@/store/user-store";
import React, { useEffect } from "react";

export const StoreProvider = ({
  user,
  token,
  children,
}: Readonly<{
  user: IUser | null;
  token: string;
  children: React.ReactNode;
}>) => {
  const { setUser } = useUserStore();
  useEffect(() => {
    setUser({ user, token });
  }, [user]);
  return <>{children}</>;
};
