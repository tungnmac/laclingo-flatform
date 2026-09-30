apps/web/
├── public/
│   ├── audio/                 # Sound effects (correct.mp3, wrong.mp3)
│   ├── images/                # Logos, LacLingo Mascot (Chim Lạc)
│   └── favicon.ico
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth Route Group
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/       # Authenticated User Layout
│   │   │   ├── learn/         # Trang học chính
│   │   │   │   └── [courseId]/page.tsx
│   │   │   ├── review/        # Trang ôn tập SRS hàng ngày
│   │   │   │   └── page.tsx
│   │   │   ├── leaderboard/   # Bảng xếp hạng
│   │   │   └── profile/
│   │   ├── api/               # Next.js Route Handlers (BFF - Backend for Frontend nếu cần)
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing Page
│   │
│   ├── components/            # UI Components
│   │   ├── ui/                # Atomic UI Components (Button, Input, Card, Modal)
│   │   ├── audio/             # Player âm thanh Web Audio API (Speed control, Waveform)
│   │   └── mascot/            # Component Linh vật Chim Lạc (Reaction khi trả lời đúng/sai)
│   │
│   ├── features/              # Modularized Business Logic
│   │   ├── srs-review/        # Logic màn hình Flashcard ôn tập
│   │   │   ├── components/    # Flashcard, QuizOption, ProgressHeader
│   │   │   ├── hooks/         # useSRSReviewSession.ts
│   │   │   └── srs.service.ts
│   │   ├── course/            # Logic khóa học & danh sách bài
│   │   └── user/              # Profile, Streak counter
│   │
│   ├── hooks/                 # Shared Custom Hooks (useAudio, useKeypress)
│   ├── lib/                   # API Axios/Fetch Instance, Client Utils
│   ├── store/                 # Zustand Stores (User Session, Current Lesson State)
│   └── types/                 # TypeScript Types/Interfaces
│
├── tailwind.config.js
└── next.config.js