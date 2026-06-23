import React from "react";
import { Navigation } from "./navigation";
import { SideBottomActions } from "./side-bottom-actions";

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
        <div className="w-full p-2 min-h-12">Command Slit</div>
        {children}
      </main>
    </div>
  );
};
