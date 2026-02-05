'use client';

import Link from 'next/link';
import { useLocale } from '@/components/useLocale';
import { t } from '@/lib/i18n';

const SECTION_KEYS: Record<string, string> = { a_stock: 'a_stock', us_stock: 'us_stock', futures: 'futures' };

type Question = {
  id: string;
  title: string;
  content: string | null;
  section: string;
  score: number;
  answer_count: number;
  created_at: string;
  author_name: string;
};

type Props = {
  question: Question;
};

export function QuestionCard({ question }: Props) {
  const locale = useLocale();
  const sectionLabel = t(`section.${SECTION_KEYS[question.section] || question.section}`, locale) || question.section;
  return (
    <Link
      href={`/question/${question.id}`}
      className="block p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
    >
      <div className="flex gap-3">
        <div className="flex flex-col items-center min-w-[2rem] pt-0.5">
          <span className="text-xs text-slate-500">↑</span>
          <span className="text-sm font-medium text-slate-700">{question.score}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 mb-1">
            {sectionLabel}
          </span>
          <h2 className="font-medium text-slate-800 leading-snug">{question.title}</h2>
          {question.content && (
            <p className="text-slate-600 text-sm mt-1 line-clamp-2">{question.content}</p>
          )}
          <p className="text-xs text-slate-400 mt-2">
            u/{question.author_name} · {question.answer_count} {t('home.answers', locale)}
          </p>
        </div>
      </div>
    </Link>
  );
}
