import { defineConfig } from 'vite'
import path from "path";
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './', // 重要：确保资源路径正确
  build: {
    outDir: 'dist', // 打包输出目录，Electron 将加载此文件夹中的内容
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
})
