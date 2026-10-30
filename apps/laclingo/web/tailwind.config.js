/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Màu chủ đạo: toàn giao diện dùng lớp indigo-* — thang indigo trỏ vào biến --brand-* để người dùng đổi tông màu
      // (theme, lib/themes.ts). Mặc định vàng đồng chim Lạc khai báo ở globals.css
      colors: {
        indigo: Object.fromEntries(
          ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map((s) => [s, `rgb(var(--brand-${s}) / <alpha-value>)`]),
        ),
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 150ms ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
