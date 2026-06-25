import { AiHubResources } from "@/components/ai-hub/ai-hub-resources";
import { useAiHubClient } from "@/hooks/use-ai-hub";
import { useConversationClient } from "@/hooks/use-conversations";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const AiHubPage = async () => {
  const { getServerSession } = useAuthServer();
  const session = await getServerSession();
  const token = session?.session.token;
  if (!token) {
    redirect("/auth");
  }

  const { getUserPreference } = usePreferenceClient();
  const { result: preference } = await getUserPreference(token);
  const organizationId = preference?.organizationId;

  if (!organizationId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <h2 className="text-lg font-semibold tracking-tight">AI Hub</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Select an organization to manage its AI Hub resources.
        </p>
      </div>
    );
  }

  const { listRecentConversations } = useConversationClient();
  const { listResources } = useAiHubClient();

  // Channels are used both to scope new resources and to resolve the
  // allowedChannelIds stored on existing resources back to readable names.
  const [conversations, resourcesRes] = await Promise.all([
    listRecentConversations({ token, organizationId }),
    listResources({ token, organizationId }),
  ]);

  const channels = conversations.result.channels.map((c) => ({
    id: c.id,
    name: c.name ?? "Untitled channel",
  }));

  return (
    <AiHubResources
      token={token}
      organizationId={organizationId}
      channels={channels}
      initialResources={resourcesRes.result ?? []}
    />
  );
};

export default AiHubPage;
