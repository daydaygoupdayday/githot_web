/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // antd 自带样式，禁用 preflight 避免 Tailwind 重置和 antd 组件样式打架
  corePlugins: { preflight: false },
  theme: {
    extend: {},
  },
  plugins: [],
}
