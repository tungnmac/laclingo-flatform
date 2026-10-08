'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { inputClass } from '@/features/auth/components/AuthForm'
import { cn } from '@/lib/utils'

interface IconEntry {
  emoji: string
  keywords: string
}

interface IconCategory {
  id: string
  label: string
  tabIcon: string
  icons: IconEntry[]
}

function cat(id: string, label: string, tabIcon: string, entries: [string, string][]): IconCategory {
  return { id, label, tabIcon, icons: entries.map(([emoji, keywords]) => ({ emoji, keywords })) }
}

export const ICON_CATEGORIES: IconCategory[] = [
  cat('smileys', 'Cảm xúc', '🙂', [
    ['🙂', 'cười mỉm smile'], ['😀', 'cười vui'], ['😂', 'cười to laugh'], ['😍', 'yêu thích thích'],
    ['😎', 'ngầu'], ['🥳', 'ăn mừng tiệc'], ['😢', 'buồn khóc'], ['😡', 'giận'],
    ['👍', 'đồng ý tốt'], ['👎', 'không đồng ý'], ['❤️', 'tim yêu'], ['⭐', 'sao star'],
    ['🔥', 'lửa hot nổi bật'], ['✨', 'lấp lánh'], ['💡', 'ý tưởng'],
  ]),
  cat('education', 'Học tập', '📘', [
    ['📘', 'sách book xanh'], ['📗', 'sách xanh lá'], ['📙', 'sách cam'], ['📕', 'sách đỏ'],
    ['📖', 'đọc sách mở'], ['📝', 'ghi chú viết'], ['✏️', 'bút chì viết'], ['🖊️', 'bút mực'],
    ['🎓', 'tốt nghiệp giáo dục'], ['🏫', 'trường học'], ['🧑‍🏫', 'giáo viên thầy cô'],
    ['🧑‍🎓', 'học sinh sinh viên'], ['🔬', 'khoa học thí nghiệm'], ['🧮', 'toán tính'], ['📐', 'thước đo'], ['🗂️', 'hồ sơ phân loại'],
  ]),
  cat('jobs', 'Nghề nghiệp', '💼', [
    ['💼', 'công việc cặp'], ['👔', 'cà vạt công sở'], ['🏢', 'công ty văn phòng'], ['📊', 'báo cáo thống kê'],
    ['💻', 'công nghệ máy tính laptop'], ['⚙️', 'kỹ thuật cơ khí'], ['🔨', 'công nhân búa'], ['🩺', 'y tế bác sĩ'],
    ['👮', 'cảnh sát công an'], ['🧑‍🌾', 'nông dân'], ['🧑‍🍳', 'đầu bếp nấu ăn'], ['🚒', 'cứu hỏa'],
    ['🚓', 'xe cảnh sát'], ['👨‍✈️', 'phi công lái máy bay'], ['👨‍💼', 'doanh nhân kinh doanh'], ['🧑‍🔧', 'thợ sửa chữa'], ['👷', 'công nhân xây dựng'],
  ]),
  cat('food', 'Ẩm thực', '🍜', [
    ['🍜', 'phở mì đồ ăn'], ['🍎', 'táo trái cây'], ['🍔', 'hamburger'], ['🍕', 'pizza'],
    ['🍟', 'khoai tây chiên'], ['🍣', 'sushi'], ['🍰', 'bánh ngọt'], ['☕', 'cà phê'],
    ['🍵', 'trà'], ['🥤', 'nước ngọt'], ['🍺', 'bia'], ['🍷', 'rượu vang'],
    ['🥗', 'rau salad'], ['🍳', 'trứng chiên'], ['🍞', 'bánh mì'], ['🍌', 'chuối'], ['🍉', 'dưa hấu'], ['🍇', 'nho'], ['🥩', 'thịt'], ['🍗', 'gà'],
  ]),
  cat('travel', 'Du lịch', '✈️', [
    ['✈️', 'máy bay du lịch'], ['🚗', 'ô tô xe hơi'], ['🚕', 'taxi'], ['🚌', 'xe buýt'],
    ['🚆', 'tàu hỏa'], ['🚢', 'tàu thuyền'], ['🚲', 'xe đạp'], ['🏨', 'khách sạn'],
    ['🗺️', 'bản đồ'], ['🧳', 'hành lý vali'], ['🚀', 'tàu vũ trụ'], ['🚁', 'trực thăng'],
    ['🛵', 'xe máy'], ['🚦', 'đèn giao thông'], ['⛽', 'xăng dầu'],
  ]),
  cat('family', 'Gia đình', '👨‍👩‍👧‍👦', [
    ['👨‍👩‍👧‍👦', 'gia đình'], ['👶', 'em bé'], ['👴', 'ông già'], ['👵', 'bà già'],
    ['🧑', 'người'], ['🧒', 'trẻ em'], ['👫', 'bạn bè'], ['👩', 'phụ nữ'],
    ['👨', 'nam giới'], ['💑', 'cặp đôi yêu nhau'], ['🤝', 'hợp tác bắt tay'],
  ]),
  cat('home', 'Nhà cửa', '🏠', [
    ['🏠', 'nhà'], ['🛋️', 'ghế sofa'], ['🛏️', 'giường ngủ'], ['🚪', 'cửa'],
    ['🪟', 'cửa sổ'], ['🔑', 'chìa khóa'], ['🧹', 'chổi dọn dẹp'], ['🧺', 'giỏ đồ'],
    ['🪑', 'ghế'], ['🚽', 'toilet'], ['🛁', 'bồn tắm'], ['🍽️', 'bát đĩa ăn'],
  ]),
  cat('nature', 'Thiên nhiên', '🌤️', [
    ['🌤️', 'nắng mây thời tiết'], ['☀️', 'mặt trời nắng'], ['🌧️', 'mưa'], ['❄️', 'tuyết lạnh'],
    ['🌈', 'cầu vồng'], ['🌍', 'trái đất thế giới'], ['🌳', 'cây'], ['🌊', 'sóng biển'],
    ['💧', 'nước giọt'], ['🌙', 'trăng'], ['⭐', 'sao'], ['🌪️', 'lốc xoáy'], ['🌵', 'xương rồng'], ['🌸', 'hoa'],
  ]),
  cat('sports', 'Thể thao & Giải trí', '⚽', [
    ['⚽', 'bóng đá'], ['🏀', 'bóng rổ'], ['🏈', 'bóng bầu dục'], ['🎾', 'tennis'],
    ['🏓', 'bóng bàn'], ['🎮', 'game chơi điện tử'], ['🎵', 'âm nhạc'], ['🎨', 'nghệ thuật vẽ'],
    ['🎭', 'kịch sân khấu'], ['🎸', 'guitar'], ['🎬', 'phim điện ảnh'], ['🏆', 'cup giải thưởng'], ['🎯', 'mục tiêu'], ['🎲', 'xúc xắc'],
  ]),
  cat('shopping', 'Quần áo & Mua sắm', '👔', [
    ['👔', 'cà vạt'], ['👗', 'váy đầm'], ['👟', 'giày'], ['👠', 'giày cao gót'],
    ['🧥', 'áo khoác'], ['👜', 'túi xách'], ['🛒', 'xe đẩy mua sắm'], ['💰', 'tiền'],
    ['💳', 'thẻ ngân hàng'], ['👒', 'mũ nón'], ['🧢', 'nón lưỡi trai'],
  ]),
  cat('health', 'Y tế', '🏥', [
    ['🏥', 'bệnh viện'], ['🩺', 'ống nghe bác sĩ'], ['💊', 'thuốc'], ['🧬', 'gen y học'],
    ['🦷', 'răng'], ['🩹', 'băng cá nhân'], ['🧪', 'thí nghiệm ống nghiệm'],
  ]),
  cat('animals', 'Động vật', '🐶', [
    ['🐶', 'chó'], ['🐱', 'mèo'], ['🐮', 'bò'], ['🐷', 'lợn heo'],
    ['🐔', 'gà'], ['🐦', 'chim'], ['🐟', 'cá'], ['🦋', 'bướm'],
    ['🐻', 'gấu'], ['🐘', 'voi'], ['🐍', 'rắn'], ['🦁', 'sư tử'], ['🐢', 'rùa'],
  ]),
]

const ALL_ICONS: IconEntry[] = ICON_CATEGORIES.flatMap((c) => c.icons)

/** Input emoji/icon có nút mở bảng chọn sẵn nằm bên trong, mép phải — vẫn cho
 * gõ/dán emoji tuỳ ý trong input. Bảng chọn có search (tìm theo từ khoá) +
 * tab theo nhóm chủ đề, click tab thì hiện icon tương ứng nhóm đó. Icon của
 * nút luôn cố định (không đổi theo emoji đang chọn). */
export function IconPickerInput({ name, defaultValue = '' }: { name: string; defaultValue?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState(ICON_CATEGORIES[0].id)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const visibleIcons = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q) return ALL_ICONS.filter((i) => i.keywords.toLowerCase().includes(q) || i.emoji === q)
    return ICON_CATEGORIES.find((c) => c.id === activeTab)?.icons ?? []
  }, [query, activeTab])

  const pick = (emoji: string) => {
    if (inputRef.current) inputRef.current.value = emoji
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input ref={inputRef} name={name} type="text" defaultValue={defaultValue} className={cn(inputClass, 'pr-10')} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-lg text-slate-400 hover:text-slate-600"
        aria-label="Chọn icon có sẵn"
      >
        🙂
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm icon theo từ khoá..."
            className={cn(inputClass, 'mb-2 text-sm')}
            autoFocus
          />
          {!query && (
            <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
              {ICON_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveTab(c.id)}
                  title={c.label}
                  className={cn(
                    'shrink-0 rounded-md px-2 py-1 text-base',
                    activeTab === c.id ? 'bg-indigo-100 ring-1 ring-indigo-300' : 'hover:bg-slate-100',
                  )}
                >
                  {c.tabIcon}
                </button>
              ))}
            </div>
          )}
          <div className="grid max-h-48 grid-cols-7 gap-1 overflow-y-auto">
            {visibleIcons.length === 0 && <p className="col-span-7 py-2 text-center text-xs text-slate-400">Không tìm thấy icon nào</p>}
            {visibleIcons.map((i) => (
              <button key={i.emoji} type="button" onClick={() => pick(i.emoji)} title={i.keywords} className="rounded p-1 text-xl hover:bg-slate-100">
                {i.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
