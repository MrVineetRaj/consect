import React, { useEffect, useState } from "react";
import { Label } from "../ui/label";
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
    <div className="h-full  overflow-auto">
      <Label className="text-xl text-muted-foreground mb-8">
        Profile Settings
      </Label>
      <div className="flex">
        <div className="flex-1/2 flex justify-center">
          <Avatar className="size-64 ">
            <Image
              src={user?.image ?? icons.avatar}
              alt="profile"
              width={300}
              height={300}
              className="rounded-full"
            />
          </Avatar>
        </div>
        <div className="flex-1/2 flex flex-col justify-center gap-4">
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
          <FormField
            value={role}
            type="text"
            onValueChange={setRole}
            icon={ShoppingBag}
            label="Your Role"
            placeholder="Software Engineer"
          />
        </div>
      </div>
      <div>
        <FormField
          label="Bio"
          placeholder="Your bio goes here..."
          type="textarea"
          value={bio}
          onValueChange={setBio}
          rows={50}
        />
      </div>
      <hr className="my-4" />
      <Label className="text-xl text-muted-foreground my-8">
        Account Settings
      </Label>
      <ActiveSessions />
    </div>
  );
};
