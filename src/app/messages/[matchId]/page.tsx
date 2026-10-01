// src/app/messages/[matchId]/page.tsx

import Messenger from "@/components/messages/Messenger";

export const metadata = { title: "Messages" };

export default async function ConversationPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <Messenger matchId={matchId} />;
}
