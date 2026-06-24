import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useUserStore } from "@/store/user-store";
import { icons } from "@/lib/assets";
import { Avatar } from "../ui/avatar";
import { FormField } from "../shared/form-field";
import { ShoppingBag, UserIcon } from "lucide-react";
import { ActiveSessions } from "./active-sessions";

export const GeneralSettings = () => {
  const { user } = useUserStore();
  const [name, setName] = useState<string>("");
  const [nickName, setNickName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [bio, setBio] = useState<string>("");

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage how you appear across the workspace.
          </p>
        </header>

        {/* Profile card */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <Avatar className="size-20 ring-2 ring-primary/20">
              <Image
                src={user?.image ?? icons.avatar}
                alt="profile"
                width={160}
                height={160}
                className="rounded-full object-cover"
              />
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-medium">
                {name || user?.name || "Your name"}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {role || "Add your role"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FormField
              value={name}
              type="text"
              onValueChange={setName}
              icon={UserIcon}
              label="Full Name"
              placeholder="John Doe"
            />
            <FormField
              value={nickName}
              type="text"
              onValueChange={setNickName}
              icon={UserIcon}
              label="Nick name"
              placeholder="Doe"
            />
          </div>

          <div className="mt-4 grid gap-4">
            <FormField
              value={role}
              type="text"
              onValueChange={setRole}
              icon={ShoppingBag}
              label="Your Role"
              placeholder="Software Engineer"
            />
            <FormField
              label="Bio"
              placeholder="Your bio goes here..."
              type="textarea"
              value={bio}
              onValueChange={setBio}
              rows={4}
            />
          </div>
        </section>

        {/* Account / security card */}
        <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Devices currently signed in to your account.
          </p>
          <ActiveSessions />
        </section>
      </div>
    </div>
  );
};
