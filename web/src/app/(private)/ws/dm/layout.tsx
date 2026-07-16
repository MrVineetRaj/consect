import { ConversationSidebar } from "@/components/conversations/conversation-sidebar";
import { useConversationClient } from "@/hooks/use-conversations";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const DirectMessageLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { getServerSession } = useAuthServer();
  const session = await getServerSession();
  const token = session?.session.token;

  if (!token) {
    redirect("/auth");
  }

  const { getUserPreference } = usePreferenceClient();
  const { result: preference } = await getUserPreference(token);

  const { listGroupsAndDMs } = useConversationClient();

  const organizationId = preference?.organizationId;
  // The DM page lists every group/DM the user belongs to — /recent's
  // last-7-days cutoff only makes sense for the home sidebar.
  const conversations = organizationId
    ? (await listGroupsAndDMs({ token, organizationId })).result
    : { dmAndGroups: [] };

  return (
    <div className="flex-1 min-h-0 flex">
      <ConversationSidebar
        channels={[]}
        dmAndGroups={conversations.dmAndGroups}
        isDMPage={true}
      />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
};

export default DirectMessageLayout;
