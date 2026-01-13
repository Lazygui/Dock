<script setup lang="ts">
import { ref } from 'vue';
import { marked } from 'marked';

// --- 状态管理 ---
const markdownInput = ref(`# Hello, Markdown!

这是一个支持实时预览的转换器。

- 列表项 1
- 列表项 2

> 引用一块文本。

\`\`\`javascript
function greet() {
  console.log("Hello, world!");
}
\`\`\``);
const htmlOutput = ref('');
const copySuccess = ref(false);

// --- 新增：右侧面板的视图模式 ---
const rightPanelMode = ref<'code' | 'preview'>('preview'); // 默认显示预览

// --- 核心逻辑 ---
const handleConvert = () => {
       if (!markdownInput.value) {
              htmlOutput.value = '';
              return;
       }
       try {
              htmlOutput.value = marked(markdownInput.value) as string;
       } catch (e) {
              console.error('Markdown 解析错误:', e);
              htmlOutput.value = '<p style="color: var(--danger);">Markdown 解析失败，请检查语法。</p>';
       }
};

// --- 工具函数 ---
const clearAll = () => {
       markdownInput.value = '';
       htmlOutput.value = '';
};

const copyResult = async () => {
       if (!htmlOutput.value) return;
       try {
              await navigator.clipboard.writeText(htmlOutput.value);
              copySuccess.value = true;
              setTimeout(() => { copySuccess.value = false; }, 2000);
       } catch (err) {
              console.error('复制失败:', err);
       }
};

const handleDownload = () => {
       if (!htmlOutput.value) {
              alert('请先转换内容再下载！');
              return;
       }
       const blob = new Blob([htmlOutput.value], { type: 'text/html;charset=utf-8' });
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `markdown-export-${Date.now()}.html`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
};
</script>

<template>
       <div class="markdown-converter-card">
              <div class="control-bar">
                     <div class="tool-title">
                            <h3>Markdown 转换器</h3>
                            <span class="title-desc">支持实时预览、代码查看与下载</span>
                     </div>
                     <div class="tool-actions">
                            <button class="icon-btn" @click="handleDownload" title="下载为.html文件" :disabled="!htmlOutput">
                                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                          <polyline points="7 10 12 15 17 10"></polyline>
                                          <line x1="12" y1="15" x2="12" y2="3"></line>
                                   </svg>
                                   下载
                            </button>
                            <button class="icon-btn danger" @click="clearAll" title="清空所有内容">
                                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                          <polyline points="3 6 5 6 21 6"></polyline>
                                          <path
                                                 d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                                          </path>
                                   </svg>
                                   清空
                            </button>
                     </div>
              </div>

              <div class="content-area">
                     <!-- 左侧输入面板 (不变) -->
                     <div class="input-group">
                            <div class="group-header">
                                   <span class="label">Markdown 输入</span>
                                   <span class="badge" title="快捷键 Ctrl + Enter">按 Ctrl+Enter 转换</span>
                            </div>
                            <textarea v-model="markdownInput" class="styled-textarea" placeholder="在此输入 Markdown 代码..."
                                   @keydown.ctrl.enter="handleConvert"></textarea>
                     </div>

                     <!-- 右侧输出/预览面板 -->
                     <div class="input-group">
                            <div class="group-header">
                                   <!-- 新增的选项卡 -->
                                   <div class="mode-tabs">
                                          <button class="tab-item" :class="{ active: rightPanelMode === 'preview' }"
                                                 @click="rightPanelMode = 'preview'">预览</button>
                                          <button class="tab-item" :class="{ active: rightPanelMode === 'code' }"
                                                 @click="rightPanelMode = 'code'">HTML 代码</button>
                                   </div>
                                   <button v-show="rightPanelMode === 'code'" class="copy-btn"
                                          :class="{ copied: copySuccess }" @click="copyResult">
                                          {{ copySuccess ? '复制成功' : '复制结果' }}
                                   </button>
                            </div>

                            <!-- 条件渲染区域 -->
                            <template v-if="rightPanelMode === 'preview'">
                                   <!-- 预览面板 -->
                                   <div class="preview-content markdown-body"
                                          v-html="htmlOutput || '<p>点击下方按钮开始转换...</p>'"></div>
                            </template>
                            <template v-else>
                                   <!-- 代码面板 -->
                                   <pre class="styled-output"><code>{{ htmlOutput || '点击下方按钮开始转换...' }}</code></pre>
                            </template>
                     </div>
              </div>

              <div class="footer-bar">
                     <button class="primary-btn" @click="handleConvert">
                            立即转换
                     </button>
              </div>
       </div>
</template>

<style scoped lang="scss">
/* --- 基础样式 (大部分复用) --- */
.markdown-converter-card {
       background-color: var(--bg-card);
       border-radius: var(--radius-box);
       padding: 24px;
       box-shadow: var(--shadow-card);
       display: flex;
       flex-direction: column;
       gap: 20px;
       height: 100%;
       border: 1px solid var(--border);
}

.control-bar {
       display: flex;
       justify-content: space-between;
       align-items: center;
       flex-wrap: wrap;
       gap: 12px;
       padding-bottom: 20px;
       border-bottom: 1px dashed var(--border);
}

.tool-title {
       h3 {
              margin: 0 0 4px 0;
              color: var(--text-main);
              font-size: 18px;
       }

       .title-desc {
              font-size: 13px;
              color: var(--text-sub);
       }
}

.tool-actions {
       display: flex;
       gap: 12px;
}

.icon-btn {
       display: flex;
       align-items: center;
       gap: 6px;
       background: transparent;
       border: 1px solid var(--border);
       color: var(--text-sub);
       padding: 6px 14px;
       border-radius: 8px;
       cursor: pointer;
       font-size: 13px;
       transition: all 0.2s;

       &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
              background-color: transparent;
       }

       &:hover:not(:disabled) {
              background-color: var(--bg-hover);
              color: var(--text-main);
              border-color: var(--border-hover);
       }

       &.danger:hover:not(:disabled) {
              color: var(--danger);
              background-color: var(--danger-bg);
              border-color: var(--danger);
       }
}

.content-area {
       display: grid;
       grid-template-columns: 1fr;
       gap: 24px;
       flex: 1;
       min-height: 0;

       @media (min-width: 768px) {
              grid-template-columns: 1fr 1fr;
       }
}

.input-group {
       display: flex;
       flex-direction: column;
       gap: 12px;
       position: relative;
       min-height: 0;
}

.group-header {
       display: flex;
       justify-content: space-between;
       align-items: center;
       min-height: 48px;
       /* <<< 关键修复：确保头部高度一致 */
}

.label {
       font-size: 14px;
       font-weight: 600;
       color: var(--text-main);
}

.badge {
       font-size: 12px;
       color: var(--text-placeholder);
       background: var(--bg-hover);
       padding: 2px 8px;
       border-radius: 4px;
}

.styled-textarea {
       flex: 1;
       width: 100%;
       min-height: 240px;
       padding: 16px;
       background-color: var(--bg-input);
       border: 1px solid var(--border);
       border-radius: 12px;
       color: var(--text-main);
       font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
       font-size: 14px;
       line-height: 1.6;
       resize: none;
       outline: none;
       transition: all 0.2s;
       box-sizing: border-box;

       &:focus {
              border-color: var(--primary);
              box-shadow: 0 0 0 3px var(--primary-subtle);
       }
}

/* 选项卡样式 */
.mode-tabs {
       display: flex;
       background-color: var(--bg-hover);
       padding: 4px;
       border-radius: 10px;
}

.tab-item {
       border: none;
       background: transparent;
       padding: 4px 16px;
       font-size: 13px;
       color: var(--text-sub);
       cursor: pointer;
       border-radius: 8px;
       font-weight: 500;
       transition: all 0.3s ease;

       &.active {
              background-color: var(--bg-card);
              color: var(--primary);
              box-shadow: var(--shadow-sm);
       }
}

/* 代码输出面板 */
.styled-output {
       flex: 1;
       width: 100%;
       min-height: 240px;
       padding: 16px;
       margin: 0;
       background-color: var(--bg-body);
       border: 1px solid var(--border);
       border-radius: 12px;
       color: var(--text-sub);
       font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
       font-size: 14px;
       line-height: 1.6;
       overflow: auto;
       white-space: pre-wrap;
       word-wrap: break-word;
       box-sizing: border-box;
}

/* 预览内容面板 */
.preview-content {
       flex: 1;
       width: 100%;
       min-height: 240px;
       padding: 16px 24px;
       background-color: var(--bg-input);
       border: 1px solid var(--border);
       border-radius: 12px;
       overflow: auto;
       box-sizing: border-box;
}

/* 复制按钮 */
.copy-btn {
       border: none;
       background: none;
       color: var(--primary);
       font-size: 12px;
       font-weight: 600;
       cursor: pointer;
       transition: all 0.2s;

       &:hover {
              text-decoration: underline;
              color: var(--primary-hover);
       }

       &.copied {
              color: var(--success);
       }
}

/* 底部按钮 */
.footer-bar {
       display: flex;
       justify-content: flex-end;
}

.primary-btn {
       background-color: var(--primary);
       color: #fff;
       border: none;
       padding: 10px 32px;
       border-radius: 8px;
       font-size: 14px;
       cursor: pointer;
       box-shadow: var(--shadow-hover);
       transition: all 0.3s;

       &:hover {
              background-color: var(--primary-hover);
              transform: translateY(-1px);
       }

       &:active {
              transform: translateY(0);
       }
}

/* --- Markdown 预览样式 --- */
.markdown-body {
       line-height: 1.7;
       color: var(--text-main);

       :deep(h1),
       :deep(h2),
       :deep(h3),
       :deep(h4),
       :deep(h5),
       :deep(h6) {
              margin-top: 24px;
              margin-bottom: 16px;
              font-weight: 600;
              line-height: 1.25;
              border-bottom: 1px solid var(--border);
              padding-bottom: .3em;
       }

       :deep(h1) {
              font-size: 2em;
       }

       :deep(h2) {
              font-size: 1.5em;
       }

       :deep(h3) {
              font-size: 1.25em;
       }

       :deep(p) {
              margin-bottom: 16px;
       }

       :deep(ul),
       :deep(ol) {
              padding-left: 2em;
              margin-bottom: 16px;
       }

       :deep(li > p) {
              margin-top: 0;
       }

       :deep(blockquote) {
              margin-left: 0;
              padding: 0 1em;
              color: var(--text-sub);
              border-left: .25em solid var(--border);
       }

       :deep(code) {
              padding: .2em .4em;
              margin: 0;
              font-size: 85%;
              background-color: var(--bg-hover);
              border-radius: 6px;
              font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
       }

       :deep(pre) {
              padding: 16px;
              overflow: auto;
              font-size: 85%;
              line-height: 1.45;
              background-color: var(--bg-body);
              border-radius: 6px;
              border: 1px solid var(--border);
       }

       :deep(pre code) {
              display: inline;
              padding: 0;
              margin: 0;
              overflow: visible;
              line-height: inherit;
              word-wrap: normal;
              background-color: transparent;
              border: 0;
       }

       :deep(table) {
              display: block;
              width: 100%;
              overflow: auto;
              margin-bottom: 16px;
              border-collapse: collapse;
       }

       :deep(tr) {
              background-color: var(--bg-card);
              border-top: 1px solid var(--border);
       }

       :deep(th),
       :deep(td) {
              padding: 6px 13px;
              border: 1px solid var(--border);
       }
}
</style>