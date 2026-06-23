import { Label } from "@/components/ui/label";
import React from "react";

const WorkspaceHome = () => {
  return (
    <div className="flex-1 min-h-0 flex">
      <div className="bg-muted w-74 flex flex-col items-start h-full rounded-tr-2xl p-2 gap-2">
        <Label className="text-muted-foreground">Channels</Label>
        <Label className="text-muted-foreground">DMs</Label>
      </div>
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* {activeTab === "general" && <GeneralSettings />} */}
        {/* {activeTab === "account" && <p>Account settings</p>} */}
      </div>
    </div>
  );
};

export default WorkspaceHome;
