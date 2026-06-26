import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useUserStore } from "@/store/user-store";
import { icons } from "@/lib/assets";
import { Avatar } from "../ui/avatar";
import { FormField } from "../shared/form-field";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CalendarIcon,
  CameraIcon,
  HistoryIcon,
  MailIcon,
  ShieldCheckIcon,
  ShieldIcon,
  ShoppingBag,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
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

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="h-full overflow-auto">
      <div className="w-full px-8 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Manage how you appear across the workspace and keep your account
              details up to date.
            </p>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-primary/30 text-primary"
          >
            <SparklesIcon className="size-3.5" />
            Personal space
          </Badge>
        </header>

        {/* Profile hero card */}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Gradient cover */}
          <div className="h-24 bg-linear-to-br from-primary/20 via-primary/10 to-accent/20" />

          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-wrap items-end gap-5">
              <div className="group relative">
                <Avatar className="size-24 rounded-2xl ring-4 ring-card">
                  <Image
                    src={user?.image ?? icons.avatar}
                    alt="profile"
                    width={160}
                    height={160}
                    className="rounded-2xl object-cover"
                  />
                </Avatar>
                <button
                  type="button"
                  aria-label="Change photo"
                  className="absolute bottom-1 right-1 grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
                >
                  <CameraIcon className="size-3.5" />
                </button>
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-xl font-semibold tracking-tight">
                    {name || user?.name || "Your name"}
                  </p>
                  {user?.emailVerified ? (
                    <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] uppercase tracking-wide text-emerald-500 hover:bg-emerald-500/10">
                      <BadgeCheckIcon className="size-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 text-[10px] uppercase tracking-wide text-amber-500"
                    >
                      Unverified
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ShoppingBag className="size-3.5" />
                  {role || "Software Engineer"}
                </p>

                {/* Meta pills */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {user?.email && (
                    <Badge variant="secondary" className="gap-1.5">
                      <MailIcon className="size-3.5" />
                      {user.email}
                    </Badge>
                  )}
                  {memberSince && (
                    <Badge variant="secondary" className="gap-1.5">
                      <CalendarIcon className="size-3.5" />
                      Joined {memberSince}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Two-column body */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Personal details — main column */}
          <section className="rounded-2xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/40 lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
                <UserIcon className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Personal details
                </h2>
                <p className="text-sm text-muted-foreground">
                  This information is visible to your teammates.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="mt-6 flex justify-end">
              <Button className="gap-1.5">
                Save changes
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          </section>

          {/* Right rail */}
          <div className="flex flex-col gap-6">
            {/* Account security summary */}
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Account security
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5 text-sm">
                    <ShieldCheckIcon className="size-4 text-muted-foreground" />
                    2FA Status
                  </span>
                  <Badge
                    variant="outline"
                    className="border-destructive/30 text-[10px] uppercase tracking-wide text-destructive"
                  >
                    Off
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5 text-sm">
                    <HistoryIcon className="size-4 text-muted-foreground" />
                    Last login
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {user?.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
              <Button variant="outline" className="mt-5 w-full gap-1.5">
                <ShieldIcon className="size-4" />
                Manage security
              </Button>
            </section>

            {/* Pro membership upsell */}
            <section className="rounded-2xl border bg-linear-to-br from-primary/10 to-accent/10 p-6 shadow-sm">
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full border-primary/30 text-primary"
              >
                <SparklesIcon className="size-3.5" />
                Pro
              </Badge>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                Pro Membership
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Unlock advanced AI analysis and team collaboration tools.
              </p>
              <Button className="mt-4 w-full">Upgrade now</Button>
            </section>
          </div>
        </div>

        {/* Active sessions — full width */}
        <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/40">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
              <ShieldIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Active sessions
              </h2>
              <p className="text-sm text-muted-foreground">
                Devices currently signed in to your account.
              </p>
            </div>
          </div>
          <ActiveSessions />
        </section>
      </div>
    </div>
  );
};
