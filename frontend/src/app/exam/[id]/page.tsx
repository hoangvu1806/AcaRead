
import { Metadata } from "next";
import ExamClient from "../ExamClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "IELTS Exam - AcaRead",
  description: "AI-Generated IELTS Reading Exam",
};

export default async function ExamPage({ params }: PageProps) {
  const { id } = await params;
  return <ExamClient sessionId={id} />;
}
