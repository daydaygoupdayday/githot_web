import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 前端开发服务器：/api 与 /health 代理到后端 githot.api.sse_api（默认 127.0.0.1:8000）
// SSE 需要关闭代理缓冲，changeOrigin 保证 Host 头正确。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
