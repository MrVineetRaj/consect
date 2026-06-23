"use client";
import { cn } from "@/lib/utils";
import { LogOutIcon, SunMoonIcon } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { Avatar } from "../ui/avatar";
import Image from "next/image";
import { icons } from "@/lib/assets";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { redirect } from "next/navigation";

export const SideBottomActions = () => {
  const { setTheme, theme } = useTheme();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        variant={"outline"}
        className={cn("flex flex-col items-center p-2 rounded-full ")}
        onClick={() => {
          setTheme(theme == "dark" ? "light" : "dark");
        }}
      >
        <SunMoonIcon />
      </Button>
      <Link href={"/ws/settings"}>
        <Avatar className="rounded-full size-10">
          <Image
            src={icons.avatar}
            height={50}
            width={50}
            alt="profile"
            className="rounded-full"
          />
        </Avatar>
      </Link>
      <Button
        variant={"destructive"}
        className={cn("flex flex-col items-center p-2 rounded ")}
        onClick={() => {
          logout().then((res) => {
            redirect("/auth")
          });
        }}
      >
        <LogOutIcon />
      </Button>
    </div>
  );
};
