import type { RouteRecordRaw } from 'vue-router'
export const toolRoutes: RouteRecordRaw[] = [
       {
              path: 'ping',
              name: 'PingTool',
              component: () => import('../views/PingTool.vue'),
              meta: {
                     title: 'Ping IP And HOST',
                     icon: 'ri-broadcast-line',
                     description: '在线检测网站延迟和丢包率，分析网络连通性。',
                     category: 'network'
              }
       },
       {
              path: 'html-to-image',
              name: 'HTMLtoIMAGETool',
              component: () => import('../views/HTMLtoImageTool.vue'),
              meta: {
                     title: 'HTML to Image',
                     icon: 'ri-image-2-line',
                     description: '批量将html转为图片',
                     category: 'convert'
              }
       },
       {
              path: 'markdown-to-hTML',
              name: 'MARKDOWNTOHTML',
              component: () => import('../views/MarkdowntoHTMLTool.vue'),
              meta: {
                     title: 'Markdown to HTML',
                     icon: 'ri-image-2-line',
                     description: 'markdown代码转HTML',
                     category: 'convert'
              }
       },
       {
              path: 'base64',
              name: 'Base64',
              component: () => import('../views/Base64Tool.vue'),
              meta: {
                     title: 'Base64 Code',
                     icon: 'ri-lock-unlock-line',
                     description: 'Base64 加密/解密',
                     category: 'crypto'
              }
       },
       {
              path: 'mermaid',
              name: 'mermaid',
              component: () => import('../views/MermaidTool.vue'),
              meta: {
                     title: 'Mermaid View',
                     icon: 'ri-markdown-line',
                     description: 'Mermaid 语法转换UI图表',
                     category: 'crypto'
              }
       }
]