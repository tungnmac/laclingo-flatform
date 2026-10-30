/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Tông chủ đạo = vàng đồng của chim Lạc (logo). Ghi đè thang indigo vì toàn bộ giao diện dùng lớp indigo-* làm
      // màu chủ đạo — đổi ở đây là đổi cả hệ thống. 500/600 lấy đúng sắc vàng trên thân chim; 600 (nút) đạt ~3.6:1 với chữ
      // trắng (đủ cho chữ đậm/thành phần giao diện) — chữ thường trên nền trắng nên dùng 700 trở lên
      colors: {
        indigo: {
          50: '#fcf8ed',
          100: '#f8eed2',
          200: '#f0dca3',
          300: '#e9c35a',
          400: '#d9ac3a',
          500: '#c4952a',
          600: '#b07d12',
          700: '#8f6914',
          800: '#6a4f13',
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
