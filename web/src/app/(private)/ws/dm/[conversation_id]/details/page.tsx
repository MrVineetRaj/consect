import { ConversationDetailsView } from "@/components/conversations/conversation-details";
import { useConversationClient } from "@/hooks/use-conversations";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const DmConversationDetailsPage = async ({
  params,
}: {
  params: Promise<{ conversation_id: string }>;
}) => {
  const { conversation_id } = await params;

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
    redirect("/ws/dm");
  }

  const { getConversationDetails, listConversationFiles } =
    useConversationClient();

  const [details, files] = await Promise.all([
    getConversationDetails({
      token,
      organizationId,
      conversationId: conversation_id,
    })
      .then((res) => res.result)
      .catch(() => null),
    listConversationFiles({
      token,
      organizationId,
      conversationId: conversation_id,
    })
      .then((res) => res.result)
      .catch(() => [] as IConversationFile[]),
  ]);

  if (!details) {
    redirect(`/ws/dm/${conversation_id}`);
  }

  return (
    <main className="h-full w-full">
      <ConversationDetailsView
        initialDetails={details}
        initialFiles={files}
        organizationId={organizationId}
        backHref={`/ws/dm/${conversation_id}`}
      />
    </main>
  );
};

export default DmConversationDetailsPage;
