import { ConversationSidebar } from "@/components/conversations/conversation-sidebar";
import { useConversationClient } from "@/hooks/use-conversations";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const HomeLayout = async ({
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

  const { getUserPreference, updateUserPreference } = usePreferenceClient();
  const { result: preference } = await getUserPreference(token);

  const { listRecentConversations } = useConversationClient();

  const organizationId = preference?.organizationId;
  const conversations = organizationId
    ? (await listRecentConversations({ token, organizationId })).result
    : { channels: [], dmAndGroups: [] };

  return (
    <div className="flex-1 min-h-0 flex">
      <ConversationSidebar
        channels={conversations.channels}
        dmAndGroups={conversations.dmAndGroups}
      />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
};

export default HomeLayout;
