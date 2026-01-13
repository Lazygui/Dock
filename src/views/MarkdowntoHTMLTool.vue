<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';

// Markdown 解析 (使用实例化的方式)
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';

// 预览区代码高亮
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// 原生 CodeMirror 6 编辑器
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// --- 全局配置 ---
const vsCodeBaseTheme = EditorView.theme({
       "&": {
              color: "#d4d4d4", // 默认文字颜色
              backgroundColor: "#1e1e1e" // VS Code 经典深色背景
       },
       ".cm-content": {
              caretColor: "#aeafad" // 光标颜色
       },
       ".cm-gutters": {
              backgroundColor: "#1e1e1e", // 行号背景
              color: "#858585", // 行号颜色
              border: "none"
       },
       ".cm-activeLineGutter": {
              backgroundColor: "transparent",
              color: "#c6c6c6" // 当前行行号高亮
       },
       "&.cm-focused .cm-selectionBackground, ::selection": {
              backgroundColor: "#264f78" // 选中文本背景色
       }
}, { dark: true });

// 定义语法高亮规则 
const vsCodeHighlightStyle = HighlightStyle.define([
       // --- Markdown 特有 ---
       { tag: tags.heading, color: "#569cd6", fontWeight: "bold" },
       { tag: tags.strong, color: "#569cd6", fontWeight: "bold" },
       { tag: tags.emphasis, fontStyle: "italic" },
       { tag: tags.list, color: "#d4d4d4" },
       { tag: tags.quote, color: "#6a9955" },

       // --- 代码块通用 ---
       { tag: tags.keyword, color: "#569cd6" },
       { tag: tags.operator, color: "#d4d4d4" },
       { tag: tags.string, color: "#ce9178" },
       { tag: tags.comment, color: "#6a9955" },

       { tag: tags.function(tags.variableName), color: "#FFD700" },
       { tag: tags.variableName, color: "#4FC1FF" },

       { tag: tags.typeName, color: "#4ec9b0" },
       { tag: tags.number, color: "#b5cea8" },
       { tag: tags.bool, color: "#569cd6" },
]);

const vsCodeTheme = [
       vsCodeBaseTheme,
       syntaxHighlighting(vsCodeHighlightStyle)
];

const marked = new Marked(
       markedHighlight({
              langPrefix: 'hljs language-',
              highlight(code, lang) {
                     const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                     return hljs.highlight(code, { language }).value;
              }
       })
);

// --- 状态管理 ---
const markdownInput = ref(`# Hello, CodeMirror 6!

这是一个使用 **原生** CodeMirror 库实现的编辑器。

- 列表项 1
- 列表项 2

\`\`\`javascript
// 这段代码在输入时就会高亮...
function greet() {
  console.log("Hello, world!");
}
// ...同时在右侧预览区也会被 highlight.js 高亮!
\`\`\``);

const htmlOutput = ref('');
const copySuccess = ref(false);
const rightPanelMode = ref<'code' | 'preview'>('preview');

// --- 新增：计算完整的 HTML 结构 ---
const fullHtmlOutput = computed(() => {
       if (!htmlOutput.value) return '';

       return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown 导出文档</title>
    <!-- 引入 highlight.js 样式 (可选) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
        h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
        p { margin-bottom: 16px; }
        blockquote { padding: 0 1em; color: #6a737d; border-left: 0.25em solid #dfe2e5; margin: 0 0 16px 0; }
        ul, ol { padding-left: 2em; margin-bottom: 16px; }
        code { padding: .2em .4em; margin: 0; font-size: 85%; background-color: rgba(27,31,35,.05); border-radius: 3px; font-family: SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace; }
        pre { padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #f6f8fa; border-radius: 3px; margin-bottom: 16px; }
        pre code { display: inline; max-width: auto; padding: 0; margin: 0; overflow: visible; line-height: inherit; word-wrap: normal; background-color: transparent; border: 0; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
        th, td { border: 1px solid #dfe2e5; padding: 6px 13px; }
        th { font-weight: 600; background-color: #f6f8fa; }
        img { max-width: 100%; box-sizing: content-box; background-color: #fff; }
    </style>
</head>
<body>

${htmlOutput.value}

</body>
</html>`;
});

// --- CodeMirror 实例和 DOM 引用 ---
const editorRef = ref<HTMLElement | null>(null);
let view: EditorView;

// --- Vue 生命周期 & CodeMirror 核心逻辑 ---

onMounted(() => {
       if (!editorRef.value) return;

       const updateListener = EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                     markdownInput.value = update.state.doc.toString();
              }
       });

       const startState = EditorState.create({
              doc: markdownInput.value,
              extensions: [
                     lineNumbers(),
                     highlightActiveLineGutter(),
                     history(),
                     keymap.of([...defaultKeymap, ...historyKeymap]),
                     markdown({
                            base: markdownLanguage,
                            codeLanguages: languages,
                     }),
                     vsCodeTheme,
                     updateListener,
                     keymap.of([{
                            key: 'Ctrl-Enter',
                            run: () => {
                                   handleConvert();
                                   return true;
                            },
                     }]),
              ],
       });

       view = new EditorView({
              state: startState,
              parent: editorRef.value,
       });

       handleConvert();
});

onUnmounted(() => {
       if (view) {
              view.destroy();
       }
});

watch(markdownInput, (newValue) => {
       if (view && newValue !== view.state.doc.toString()) {
              view.dispatch({
                     changes: { from: 0, to: view.state.doc.length, insert: newValue },
              });
       }
});

// --- 核心转换与工具函数 ---

const handleConvert = () => {
       if (!markdownInput.value) {
              htmlOutput.value = '';
              return;
       }
       try {
              const result = marked.parse(markdownInput.value);
              if (typeof result === 'string') {
                     htmlOutput.value = result;
              } else {
                     result.then(html => htmlOutput.value = html);
              }
       } catch (e) {
              console.error('Markdown 解析错误:', e);
              htmlOutput.value = '<p style="color: var(--danger);">Markdown 解析失败，请检查语法。</p>';
       }
};

const clearAll = () => {
       markdownInput.value = '';
};

// 修改：复制时复制完整的 HTML 结构
const copyResult = async () => {
       if (!fullHtmlOutput.value) return;
       try {
              await navigator.clipboard.writeText(fullHtmlOutput.value);
              copySuccess.value = true;
              setTimeout(() => { copySuccess.value = false; }, 2000);
       } catch (err) {
              console.error('复制失败:', err);
       }
};

// 修改：下载时使用完整的 HTML 结构
const handleDownload = () => {
       if (!fullHtmlOutput.value) {
              alert('请先转换内容再下载！');
              return;
       }
       const blob = new Blob([fullHtmlOutput.value], { type: 'text/html;charset=utf-8' });
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
              <!-- 顶部控制栏 -->
              <div class="control-bar">
                     <div class="tool-title">
                            <h3>Markdown 转换器</h3>
                            <span class="title-desc">支持实时预览、代码查看与下载</span>
                     </div>
                     <div class="tool-actions">
                            <!-- 下载按钮逻辑已更新，使用 fullHtmlOutput -->
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
                                                 d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2">
                                          </path>
                                   </svg>
                                   清空
                            </button>
                     </div>
              </div>

              <!-- 主内容区 -->
              <div class="content-area">
                     <!-- 左侧：CodeMirror 编辑器 -->
                     <div class="input-group">
                            <div class="group-header">
                                   <span class="label">Markdown 输入</span>
                            </div>
                            <div ref="editorRef" class="styled-codemirror"></div>
                     </div>

                     <!-- 右侧：输出/预览面板 -->
                     <div class="input-group">
                            <div class="group-header">
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

                            <template v-if="rightPanelMode === 'preview'">
                                   <!-- 预览模式：依然使用 htmlOutput (片段)，因为它是渲染在 div 里的 -->
                                   <div class="preview-content markdown-body"
                                          v-html="htmlOutput || '<p>点击下方按钮开始转换...</p>'"></div>
                            </template>
                            <template v-else>
                                   <!-- 代码模式：使用 fullHtmlOutput (完整文档) -->
                                   <pre class="styled-output"><code>{{ fullHtmlOutput || '点击下方按钮开始转换...' }}</code></pre>
                            </template>
                     </div>
              </div>

              <!-- 底部操作栏 -->
              <div class="footer-bar">
                     <button class="primary-btn" @click="handleConvert">
                            立即转换
                     </button>
              </div>
       </div>
</template>

<style scoped lang="scss">
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
       grid-template-columns: 1fr 1fr;
       gap: 24px;
       flex: 1;
       min-height: 0;
       overflow-y: auto;
}

.input-group {
       display: flex;
       flex-direction: column;
       gap: 12px;
       position: relative;
       min-width: 0;
       overflow: hidden;
}

.group-header {
       display: flex;
       justify-content: space-between;
       align-items: center;
       min-height: 48px;
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

.styled-codemirror {
       flex: 1;
       min-height: 240px;
       border: 1px solid var(--border);
       border-radius: 12px;
       overflow: hidden;

       :deep(.cm-editor) {
              height: 100%;
              outline: none;
              background-color: var(--bg-input);
       }

       :deep(.cm-scroller) {
              overflow: auto;
              font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
       }

       :deep(.cm-gutters) {
              background-color: var(--bg-input);
              border-right: 1px solid var(--border);
       }

       :deep(.cm-content) {
              font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.6;
              color: var(--text-main);
       }

       :deep(.cm-editor.cm-focused) {
              outline: none !important;
       }

       &:focus-within {
              border-color: var(--primary);
              box-shadow: 0 0 0 3px var(--primary-subtle);
       }
}

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
       }

       :deep(pre) {
              padding: 0;
              margin: 0 0 16px;
              background-color: transparent;
              border-radius: 6px;
              overflow: hidden;
       }

       :deep(pre code) {
              padding: 1em;
              line-height: 1.45;
              display: block;
              overflow-x: auto;
       }
}
</style>