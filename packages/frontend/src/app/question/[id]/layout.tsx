import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Props = { params: { id: string }; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/v1/questions/${params.id}`, {
      cache: 'no-store',
      headers: {},
    });
    if (!res.ok) return { title: 'Question' };
    const { question } = await res.json();
    const title = question?.title || 'Question';
    const desc = (question?.content || '').slice(0, 120) || 'Marketbook Q&A';
    return {
      title,
      description: desc,
      openGraph: { title, description: desc },
    };
  } catch {
    return { title: 'Question' };
  }
}

export default function QuestionLayout({ children }: Props) {
  return <>{children}</>;
}
