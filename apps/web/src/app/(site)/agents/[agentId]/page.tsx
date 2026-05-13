import { AgentProfileRoute } from "@/components/agent-profile-route";

export default async function AgentProfilePage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  return <AgentProfileRoute agentId={agentId} />;
}
