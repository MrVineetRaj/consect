import { OrganizationModel } from "@/components/ws/organizations-model";
import { MessagesSquareIcon } from "lucide-react";
import React from "react";

const DirectMessagePage = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
        <MessagesSquareIcon className="size-8" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold tracking-tight">
          Welcome to your workspace
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Pick a channel or direct message from the sidebar to jump into the
          conversation.
        </p>
      </div>

      <OrganizationModel />
    </div>
  );
};

export default DirectMessagePage;
