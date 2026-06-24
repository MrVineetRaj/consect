"use client";
import { icons } from "@/lib/assets";
import React, { useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import { FormField } from "../shared/form-field";
import { EyeClosed, EyeIcon, LockIcon, MailIcon, UserIcon } from "lucide-react";
import {
  redirect,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

type OAuthButtonProps = {
  label: string;
  icon: string;
  slug: string;
};
const OAuthButton = ({ label, icon, slug }: OAuthButtonProps) => {
  return (
    <Button className="bg-background! text-foreground p-4 ">
      <Image src={icon} width={50} height={50} alt={label} className="w-6" />
      Continue with {label}
    </Button>
  );
};
type AuthTab = "signin" | "signup";

export const AuthForm = () => {
  const { emailLogin, emailSignup } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab: AuthTab =
    searchParams.get("tab") === "signin" ? "signin" : "signup";
  const isSignup = tab === "signup";

  const setTab = (next: AuthTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const OAuthOptions = [
    {
      label: "Google",
      icon: icons.google,
      slug: "google",
    },
    {
      label: "Github",
      icon: icons.github,
      slug: "github",
    },
  ];

  return (
    <>
      <h1 className="font-bold text-lg">
        {isSignup ? "Create your account on" : "Continue Sign In to"}{" "}
        <span className="text-primary">Consect</span>
      </h1>
      <div className="w-full p-4 md:p-8 rounded-md max-w-98 ">
        <div className="flex flex-col gap-2">
          {OAuthOptions.map((opt) => (
            <OAuthButton
              label={opt.label}
              icon={opt.icon}
              slug={opt.slug}
              key={opt.slug}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 my-4 text-muted-foreground">
          <hr className="flex-3/7" />
          <p className="flex-1/7 text-center">or</p>
          <hr className="flex-3/7" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isSignup) {
              emailSignup({ email, password, name: fullName }).then((res) => {
                
              });
            } else {
              emailLogin({ email, password }).then((res) => {
                if (res.data?.token) {
                  redirect("/ws");
                }
              });
            }
          }}
          className="space-y-2"
        >
          {isSignup && (
            <FormField
              label="Full Name"
              value={fullName}
              placeholder="John Doe"
              icon={UserIcon}
              onValueChange={(val) => {
                setFullName(val);
              }}
              type="text"
            />
          )}
          <FormField
            label="Email"
            value={email}
            placeholder="example@abc.xyz"
            icon={MailIcon}
            onValueChange={(val) => {
              setEmail(val);
            }}
            type="text"
          />
          <FormField
            label="Password"
            placeholder="Your password goes.."
            icon={LockIcon}
            value={password}
            onValueChange={(val) => {
              setPassword(val);
            }}
            type={showPassword ? "text" : "password"}
            endIcon={showPassword ? EyeIcon : EyeClosed}
            onEndIconClick={() => {
              setShowPassword((prev) => !prev);
            }}
          />
          {isSignup && (
            <FormField
              label="Confirm Password"
              placeholder="Re-enter your password"
              icon={LockIcon}
              value={confirmPassword}
              onValueChange={(val) => {
                setConfirmPassword(val);
              }}
              type={showPassword ? "text" : "password"}
              endIcon={showPassword ? EyeIcon : EyeClosed}
              onEndIconClick={() => {
                setShowPassword((prev) => !prev);
              }}
            />
          )}
          {!isSignup && (
            <p className="text-primary text-xs w-full text-right">
              Forgot Password ?
            </p>
          )}
          <Button className="text-center w-full">
            {isSignup ? "Sign Up" : "Continue"}
          </Button>
        </form>
        <p className="text-muted-foreground text-sm text-center mt-4">
          {isSignup ? "Already a user?" : "New user?"}{" "}
          <button
            type="button"
            onClick={() => setTab(isSignup ? "signin" : "signup")}
            className="text-primary font-medium hover:underline"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </>
  );
};
