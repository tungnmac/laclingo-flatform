'use client'

import { useRef, useState, type ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import Youtube from '@tiptap/extension-youtube'
import { blogService } from '@/features/blog/blog.service'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'

/** Rich text editor đầy đủ công cụ (Tiptap) — ảnh/video YouTube chèn NGAY
 * TRONG content (như Notion/Medium), không có gallery/danh sách link riêng.
 * Ảnh upload KHÔNG cần postId (xem blogService.uploadImage) nên dùng được cả
 * khi đang soạn bài MỚI. Chỉ render phía client — Tiptap cần DOM. */
export function RichTextEditor({
  content,
  onChange,
  placeholder,
}: {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const t = useTranslation()
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true, defaultProtocol: 'https' } }),
      Image,
      Youtube.configure({ nocookie: true }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'prose prose-slate max-w-none focus:outline-none min-h-[200px] px-3 py-2.5' },
    },
  })

  if (!editor) return null

  const onFileSelected = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const res = await blogService.uploadImage(file)
      editor.chain().focus().setImage({ src: res.url }).run()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const onAddYoutube = () => {
    const url = window.prompt(t.blog.youtubePrompt)
    if (!url) return
    editor.commands.setYoutubeVideo({ src: url })
  }

  const onAddLink = () => {
    const url = window.prompt(t.blog.linkPrompt)
    if (!url) return
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="rounded-lg ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-indigo-600">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2 py-1.5">
        <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •≡
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.≡
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          ❝
        </ToolbarButton>
        <ToolbarButton label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          {'</>'}
        </ToolbarButton>
        <Divider />
        <ToolbarButton label={t.blog.linkPrompt} onClick={onAddLink}>
          🔗
        </ToolbarButton>
        <ToolbarButton label={t.blog.insertImageLabel} disabled={uploading} onClick={() => fileInput.current?.click()}>
          {uploading ? '…' : '🖼️'}
        </ToolbarButton>
        <ToolbarButton label={t.blog.insertYoutubeLabel} onClick={onAddYoutube}>
          ▶️
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          ↶
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          ↷
        </ToolbarButton>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelected(file)
        }}
      />

      <EditorContent editor={editor} />
      {error && <p className="px-3 pb-2 text-xs text-rose-600">{error}</p>}
    </div>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-slate-200" />
}

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded px-2 py-1 text-xs font-semibold transition disabled:opacity-50',
        active ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
      )}
    >
      {children}
    </button>
  )
}
