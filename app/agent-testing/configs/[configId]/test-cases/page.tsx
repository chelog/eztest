import AgentTestCasesPage from "@/frontend/components/agent-testing/AgentTestCasesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тест-кейсы | Тестирование агентов | EZTest",
  description: "Просмотр, редактирование и запуск тест-кейсов конфигурации агента.",
};

export default async function TestCasesPage({
  params,
}: {
  params: Promise<{ configId: string }>;
}) {
  const { configId } = await params;
  return <AgentTestCasesPage configId={configId} />;
}
