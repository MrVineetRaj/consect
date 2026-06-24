import { redirect } from "next/navigation";
import React from "react";

const WorkspaceEntry = () => {
  redirect("/ws/home");
  return <div>WorkspaceEntry</div>;
};

export default WorkspaceEntry;
