/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Tông chủ đạo = vàng đồng của chim Lạc (logo). Ghi đè thang indigo vì toàn bộ giao diện dùng lớp indigo-* làm
      // màu chủ đạo — đổi ở đây là đổi cả hệ thống. 600 (nút, chữ nhấn) đủ tương phản với chữ trắng (~5:1)
      colors: {
        indigo: {
          50: '#fcf8ed',
          100: '#f8eed2',
          200: '#f0dca3',
          300: '#e7c66d',
          400: '#d2a535',
          500: '#ab7f1c',
          600: '#8f6914',
          700: '#765615',
          800: '#5f4515',
          900: '#4e3a14',
          950: '#2c2009',
        },
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
