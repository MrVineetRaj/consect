import React from "react";
import { Navigation } from "./navigation";
import { SideBottomActions } from "./side-bottom-actions";
import { OrganizationModel } from "./organizations-model";
import { CommandSlit } from "./command-slit";

export const WorkspaceShell = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="bg-primary/50 h-svh overflow-hidden flex p-3 gap-3">
      <aside className="w-13 pt-3 flex flex-col justify-between">
        <Navigation />
        <SideBottomActions />
      </aside>
      <main className="bg-background w-full h-full rounded-lg flex flex-col overflow-hidden">
        <CommandSlit />
        {children}
      </main>
      <OrganizationModel />
    </div>
  );
};
