import { ConversationAvatar } from "@/components/shared/conversation-avatar";

import { Label } from "@/components/ui/label";
import { useConversationClient } from "@/hooks/use-conversations";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { HashIcon } from "lucide-react";
import Link from "next/link";
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

  const { getUserPreference } = usePreferenceClient();
  const { result: preference } = await getUserPreference(token);

  const { listRecentConversations } = useConversationClient();
  // const {} = useW

  const organizationId = preference?.organizationId;
  const conversations = organizationId
    ? (await listRecentConversations({ token, organizationId })).result
    : { channels: [], dmAndGroups: [] };

  return (
    <div className="flex-1 min-h-0 flex">
      <div className="bg-muted w-74 flex flex-col items-start h-full rounded-tr-2xl p-2 gap-2">
        <Label className="text-muted-foreground">Channels</Label>
        {conversations.channels.map((channel) => {
          return (
            <Link
              key={channel.id}
              href={`/ws/home/${channel.id}`}
              className="flex items-center px-2 py-1 cursor-pointer w-full"
            >
              <HashIcon className="size-4" />
              <p className="">{channel.name}</p>
            </Link>
          );
        })}
        <Label className="text-muted-foreground">DMs</Label>
        {conversations.dmAndGroups.map((conversation) => {
          return (
            <Link
              key={conversation.id}
              href={`/ws/home/${conversation.id}`}
              className="flex items-center gap-2 px-2 py-1 cursor-pointer w-full"
            >
              <ConversationAvatar
                image={conversation.image}
                members={conversation.members}
              />
              <p className="">
                {conversation.name ??
                  conversation.members.map((memb) => memb.name).join(", ") +
                    (conversation?.members.length > 4 ? "..." : "")}
              </p>
            </Link>
          );
        })}
      </div>
      <div className="flex-1 flex flex-col  overflow-hidden">{children}</div>
    </div>
  );
};

export default HomeLayout;
