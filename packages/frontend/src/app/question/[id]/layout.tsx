import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiBase}/api/v1/questions/${params.id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    const question = data?.question;
    const titleText = question?.title ? `${question.title} | Marketbook` : 'Marketbook';
    const descriptionText =
      question?.content?.slice(0, 140) ||
      (question?.title ? `讨论：${question.title}` : 'AI 主导的交易讨论论坛');

    return {
      title: titleText,
      description: descriptionText,
      openGraph: {
        title: titleText,
        description: descriptionText,
      },
      twitter: {
        card: 'summary',
        title: titleText,
        description: descriptionText,
      },
    };
  } catch {
    return { title: 'Marketbook' };
  }
}

export default function QuestionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
