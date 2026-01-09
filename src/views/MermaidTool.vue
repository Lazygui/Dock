<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { renderMermaidWithPanZoom } from '@/api/mermaid';

// --- 状态定义 ---
const codeContent = ref(`graph TD
    A[Client] -->|HTTP Request| B(Load Balancer)
    B -->|Forward| C{Service Registry}
    C -->|Discover| D[Microservice A]
    C -->|Discover| E[Microservice B]
    D --> F[(Database)]
    E --> F
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style F fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5`);

const mermaidContainer = ref<HTMLElement | null>(null);
const isRendering = ref(false);
let cleanupFn: (() => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// --- 核心逻辑 ---

// 执行渲染
const triggerRender = async () => {
       if (!mermaidContainer.value) return;

       isRendering.value = true;

       // 1. 如果存在旧的清理函数，先执行清理（移除旧的监听器）
       if (cleanupFn) {
              cleanupFn();
              cleanupFn = null;
       }

       // 2. 调用封装的 API
       // 注意：API 内部会处理 innerHTML 清空和错误显示
       cleanupFn = await renderMermaidWithPanZoom(
              mermaidContainer.value,
              codeContent.value
       );

       isRendering.value = false;
};

// 防抖监听输入
const codeWatch = watch(codeContent, () => {
       if (debounceTimer) clearTimeout(debounceTimer);
       debounceTimer = setTimeout(() => {
              triggerRender();
       }, 800);
});

// 手动重置视图（本质是重新渲染）
const resetView = () => {
       triggerRender();
};

// 导出 SVG
const handleDownload = () => {
       if (!mermaidContainer.value) return;
       const svg = mermaidContainer.value.querySelector('svg');
       if (!svg) return;

       // 序列化 SVG
       const serializer = new XMLSerializer();
       let source = serializer.serializeToString(svg);

       // 添加命名空间（如果缺失）
       if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
              source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
       }

       // 创建下载链接
       const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
       const link = document.createElement("a");
       link.download = `mermaid-chart-${Date.now()}.svg`;
       link.href = url;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
};

// 模版加载
const loadExample = (type: 'flow' | 'seq' | 'class') => {
       if (type === 'flow') codeContent.value = `graph TD\n  Start --> Stop`;
       if (type === 'seq') codeContent.value = `sequenceDiagram\n  Alice->>John: Hello John, how are you?`;
       if (type === 'class') codeContent.value = `classDiagram\n  class Animal{\n    +int age\n    +String gender\n  }`;
       // watch 会自动触发渲染
};

// --- 生命周期 ---
onMounted(() => {
       triggerRender();
});

onUnmounted(() => {
       if (debounceTimer) clearTimeout(debounceTimer);
       if (cleanupFn) cleanupFn();
       codeWatch()
});
</script>

<template>
       <div class="mermaid-card">

              <!-- 顶部工具栏 -->
              <div class="toolbar">
                     <div class="toolbar-left">
                            <span class="tool-label">快速模版:</span>
                            <div class="template-chips">
                                   <button class="chip" @click="loadExample('flow')">流程图</button>
                                   <button class="chip" @click="loadExample('seq')">时序图</button>
                                   <button class="chip" @click="loadExample('class')">类图</button>
                            </div>
                     </div>

                     <div class="toolbar-right">
                            <!-- 状态指示灯 -->
                            <div class="status-indicator">
                                   <span class="dot" :class="{ 'processing': isRendering }"></span>
                                   {{ isRendering ? '渲染中...' : '就绪' }}
                            </div>
                            <div class="divider"></div>
                            <button class="icon-btn" @click="resetView" title="重置视图">
                                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                          <path d="M3 3v5h5"></path>
                                   </svg>
                            </button>
                            <button class="primary-btn sm" @click="handleDownload">导出 SVG</button>
                     </div>
              </div>

              <!-- 主体区域 (桌面端左右布局) -->
              <div class="main-split">

                     <!-- 左侧：编辑器 -->
                     <div class="pane editor-pane">
                            <div class="pane-header">
                                   <div class="header-title">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" stroke-width="2">
                                                 <polyline points="16 18 22 12 16 6"></polyline>
                                                 <polyline points="8 6 2 12 8 18"></polyline>
                                          </svg>
                                          <span>代码编辑</span>
                                   </div>
                            </div>

                            <div class="editor-wrapper">
                                   <textarea v-model="codeContent" class="code-textarea" spellcheck="false"
                                          placeholder="在此输入 Mermaid 代码..."></textarea>
                            </div>
                     </div>

                     <!-- 右侧：预览区 -->
                     <div class="pane preview-pane">
                            <div class="pane-header">
                                   <div class="header-title">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" stroke-width="2">
                                                 <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                 <circle cx="12" cy="12" r="3"></circle>
                                          </svg>
                                          <span>实时预览</span>
                                   </div>
                                   <span class="hint-text">滚轮缩放 / 拖拽平移</span>
                            </div>

                            <!-- 
          渲染容器 
          注意：这里不需要 overflow:auto，因为你的 API 设置了 overflow:hidden 并处理了 transform
        -->
                            <div class="preview-viewport">
                                   <div ref="mermaidContainer" class="render-target"></div>
                            </div>
                     </div>

              </div>
       </div>
</template>

<style scoped>
/* 容器 */
.mermaid-card {
       background-color: var(--bg-card);
       border-radius: var(--radius-box);
       box-shadow: var(--shadow-card);
       display: flex;
       flex-direction: column;
       height: 100%;
       min-height: 600px;
       /* 最小高度 */
       overflow: hidden;
       border: 1px solid var(--border);
}

/* 顶部工具栏 */
.toolbar {
       padding: 12px 20px;
       border-bottom: 1px solid var(--border);
       display: flex;
       justify-content: space-between;
       align-items: center;
       background-color: var(--bg-card);
       flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
       display: flex;
       align-items: center;
       gap: 12px;
}

.tool-label {
       font-size: 13px;
       color: var(--text-sub);
       font-weight: 500;
}

.template-chips {
       display: flex;
       gap: 8px;
}

.chip {
       background: var(--bg-hover);
       border: 1px solid transparent;
       padding: 4px 12px;
       border-radius: 6px;
       font-size: 12px;
       color: var(--text-main);
       cursor: pointer;
       transition: all 0.2s;
}

.chip:hover {
       background: var(--bg-input);
       border-color: var(--border-hover);
       color: var(--primary);
}

.status-indicator {
       font-size: 12px;
       color: var(--text-sub);
       display: flex;
       align-items: center;
       gap: 6px;
}

.dot {
       width: 8px;
       height: 8px;
       border-radius: 50%;
       background-color: var(--success);
}

.dot.processing {
       background-color: var(--warning);
       animation: pulse 1s infinite;
}

@keyframes pulse {
       0% {
              opacity: 1;
       }

       50% {
              opacity: 0.5;
       }

       100% {
              opacity: 1;
       }
}

.divider {
       width: 1px;
       height: 20px;
       background-color: var(--border);
       margin: 0 4px;
}

/* 主体分割布局 */
.main-split {
       display: flex;
       flex: 1;
       min-height: 0;
       background-color: var(--bg-body);
}

/* 通用面板样式 */
.pane {
       flex: 1;
       display: flex;
       flex-direction: column;
       min-width: 0;
}

.editor-pane {
       border-right: 1px solid var(--border);
       background-color: var(--bg-card);
       z-index: 2;
       box-shadow: 4px 0 12px rgba(0, 0, 0, 0.03);
}

.preview-pane {
       background-color: var(--bg-body);
       /* 棋盘格背景 */
       background-image:
              linear-gradient(45deg, #eef0f2 25%, transparent 25%),
              linear-gradient(-45deg, #eef0f2 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #eef0f2 75%),
              linear-gradient(-45deg, transparent 75%, #eef0f2 75%);
       background-size: 20px 20px;
       background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

/* 面板头部 */
.pane-header {
       padding: 10px 16px;
       display: flex;
       justify-content: space-between;
       align-items: center;
       border-bottom: 1px dashed var(--border);
       background-color: var(--bg-card);
       height: 48px;
       flex-shrink: 0;
}

.header-title {
       display: flex;
       align-items: center;
       gap: 8px;
       font-size: 13px;
       font-weight: 600;
       color: var(--text-sub);
       text-transform: uppercase;
       letter-spacing: 0.5px;
}

.hint-text {
       font-size: 12px;
       color: var(--text-placeholder);
}

/* 编辑器区域 */
.editor-wrapper {
       flex: 1;
       position: relative;
       overflow: hidden;
}

.code-textarea {
       width: 100%;
       height: 100%;
       border: none;
       resize: none;
       padding: 16px;
       font-family: 'Menlo', 'Monaco', 'Fira Code', monospace;
       font-size: 14px;
       line-height: 1.6;
       color: var(--text-main);
       background-color: transparent;
       outline: none;
}

.code-textarea:focus {
       background-color: transparent;
       outline: none;
}

/* 预览可视区域 */
.preview-viewport {
       flex: 1;
       position: relative;
       overflow: hidden;
       /* 必须 hidden，内容由 transform 控制 */
       width: 100%;
       height: 100%;
}

.render-target {
       width: 100%;
       height: 100%;
       /* 你的 API 会在这里挂载 SVG 并设置 cursor: grab */
}

/* 按钮复用样式 */
.icon-btn {
       width: 32px;
       height: 32px;
       display: flex;
       align-items: center;
       justify-content: center;
       border: 1px solid var(--border);
       background: transparent;
       color: var(--text-sub);
       border-radius: 8px;
       cursor: pointer;
       transition: all 0.2s;
}

.icon-btn:hover {
       border-color: var(--primary);
       color: var(--primary);
       background-color: var(--primary-subtle);
}

.primary-btn {
       background-color: var(--primary);
       color: #fff;
       border: none;
       padding: 8px 16px;
       border-radius: 8px;
       font-size: 14px;
       cursor: pointer;
       transition: all 0.2s;
}

.primary-btn.sm {
       font-size: 13px;
       padding: 6px 14px;
       height: 32px;
}

.primary-btn:hover {
       background-color: var(--primary-hover);
       box-shadow: var(--shadow-hover);
}
</style>