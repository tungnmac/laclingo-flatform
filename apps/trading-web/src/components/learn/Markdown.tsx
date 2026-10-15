'use client'

import Link from 'next/link'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Không dùng rehype-raw: HTML thô trong Markdown KHÔNG được render (chống XSS từ nội dung bài)
const components: Components = {
  h1: ({ children }) => <h2 className="mt-6 text-2xl font-bold">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-6 text-xl font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-4 text-lg font-semibold">{children}</h3>,
  p: ({ children }) => <p className="mt-3 leading-7 text-slate-700">{children}</p>,
  ul: ({ children }) => <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">{children}</ul>,
  ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1 pl-6 text-slate-700">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="mt-3 rounded-r-lg border-l-4 border-emerald-500 bg-emerald-50 px-4 py-2 text-slate-700">{children}</blockquote>
  ),
  code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">{children}</code>,
  table: ({ children }) => (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-slate-100 px-3 py-2">{children}</td>,
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ src, alt }) => <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} className="mt-3 max-w-full rounded-lg" />,
  a: ({ href, children }) =>
    href?.startsWith('/') ? (
      <Link href={href} className="font-semibold text-emerald-700 underline">
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline">
        {children}
      </a>
    ),
}

export function Markdown({ source }: { source: string }) {
  return (
    <div className="text-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
