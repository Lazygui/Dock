<script setup lang="ts">
import { ref } from 'vue';

// --- 类型定义 ---
type Mode = 'encode' | 'decode';

// --- 状态管理 ---
const inputContent = ref('');
const outputContent = ref('');
const currentMode = ref<Mode>('encode');
const copySuccess = ref(false);

// --- 核心逻辑 ---

// 执行转换 (核心算法不变)
const handleConvert = () => {
       // 1. 如果输入为空，清空输出并返回
       if (!inputContent.value) {
              outputContent.value = '';
              return;
       }

       try {
              if (currentMode.value === 'encode') {
                     // 加密
                     outputContent.value = window.btoa(unescape(encodeURIComponent(inputContent.value)));
              } else {
                     // 解密
                     outputContent.value = decodeURIComponent(escape(window.atob(inputContent.value)));
              }
       } catch (e) {
              outputContent.value = currentMode.value === 'encode'
                     ? '编码错误：无法转换该内容'
                     : '解码错误：无效的 Base64 字符串';
       }
};

// --- 工具函数 ---

// 切换模式
const toggleMode = (mode: Mode) => {
       if (currentMode.value === mode) return;

       currentMode.value = mode;
       // 切换模式时，建议清空输出结果，以免用户看着“加密的输入”对应“解密的输出”感到困惑
       // 或者你也可以选择保留 outputContent.value = ''，看需求
       outputContent.value = '';
};

// 交换输入输出 (交换后通常需要立即查看结果，所以这里保留自动转换)
const exchange = () => {
       if (!outputContent.value && !inputContent.value) return;

       // 将输出结果放回输入框
       inputContent.value = outputContent.value;
       // 交换模式
       currentMode.value = currentMode.value === 'encode' ? 'decode' : 'encode';
       // 清空输出，等待用户点击转换，或者直接触发转换
       // 这里为了流程顺畅，交换后自动触发一次转换是比较合理的
       handleConvert();
};

// 清空
const clearAll = () => {
       inputContent.value = '';
       outputContent.value = '';
};

// 复制
const copyResult = async () => {
       if (!outputContent.value) return;
       try {
              await navigator.clipboard.writeText(outputContent.value);
              copySuccess.value = true;
              setTimeout(() => { copySuccess.value = false; }, 2000);
       } catch (err) {
              console.error('复制失败', err);
       }
};
</script>

<template>
       <div class="base64-card">

              <!-- 控制栏 -->
              <div class="control-bar">
                     <div class="mode-tabs">
                            <button class="tab-item" :class="{ active: currentMode === 'encode' }"
                                   @click="toggleMode('encode')">
                                   Base64 加密
                            </button>
                            <button class="tab-item" :class="{ active: currentMode === 'decode' }"
                                   @click="toggleMode('decode')">
                                   Base64 解密
                            </button>
                     </div>

                     <div class="tool-actions">
                            <button class="icon-btn" @click="exchange" title="交换输入输出">
                                   <!-- SVG 省略，同上 -->
                                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                          <polyline points="17 1 21 5 17 9"></polyline>
                                          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                                          <polyline points="7 23 3 19 7 15"></polyline>
                                          <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                                   </svg>
                                   交换
                            </button>
                            <button class="icon-btn danger" @click="clearAll" title="清空">
                                   <!-- SVG 省略，同上 -->
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

              <!-- 内容区 -->
              <div class="content-area">

                     <!-- 输入 -->
                     <div class="input-group">
                            <div class="group-header">
                                   <span class="label">待转换内容</span>
                                   <!-- 提示用户可以使用快捷键 -->
                                   <span class="badge" title="快捷键 Ctrl + Enter">按 Ctrl+Enter 转换</span>
                            </div>
                            <!-- 
           注意：这里移除了 watch，
           添加了 @keydown.ctrl.enter 监听
        -->
                            <textarea v-model="inputContent" class="styled-textarea"
                                   :placeholder="currentMode === 'encode' ? '请输入需要加密的文本...' : '请输入 Base64 编码...'"
                                   @keydown.ctrl.enter="handleConvert"></textarea>
                     </div>

                     <!-- 输出 -->
                     <div class="input-group">
                            <div class="group-header">
                                   <span class="label">转换结果</span>
                                   <button class="copy-btn" :class="{ copied: copySuccess }" @click="copyResult">
                                          {{ copySuccess ? '复制成功' : '复制结果' }}
                                   </button>
                            </div>
                            <textarea v-model="outputContent" class="styled-textarea result" readonly
                                   placeholder="点击下方按钮开始转换..."></textarea>
                     </div>
              </div>

              <!-- 底部按钮：现在它是唯一触发转换的主要入口 -->
              <div class="footer-bar">
                     <button class="primary-btn" @click="handleConvert">
                            立即转换
                     </button>
              </div>

       </div>
</template>

<style scoped>
/* 样式与之前保持完全一致，无需修改 */
/* 为了节省篇幅，这里引用上一条回答的 CSS 即可 */
/* ... CSS 代码 ... */

.base64-card {
       background-color: var(--bg-card);
       border-radius: var(--radius-box);
       padding: 24px;
       box-shadow: var(--shadow-card);
       display: flex;
       flex-direction: column;
       gap: 20px;
       height: 100%;
}

/* ... 略 ... */

.control-bar {
       display: flex;
       justify-content: space-between;
       align-items: center;
       flex-wrap: wrap;
       gap: 12px;
       padding-bottom: 20px;
       border-bottom: 1px dashed var(--border);
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
       padding: 8px 20px;
       font-size: 14px;
       color: var(--text-sub);
       cursor: pointer;
       border-radius: 8px;
       font-weight: 500;
       transition: all 0.3s ease;
}

.tab-item.active {
       background-color: var(--bg-card);
       color: var(--primary);
       box-shadow: var(--shadow-sm);
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
}

.icon-btn:hover {
       background-color: var(--bg-hover);
       color: var(--text-main);
       border-color: var(--border-hover);
}

.icon-btn.danger:hover {
       color: var(--danger);
       background-color: var(--danger-bg);
       border-color: var(--danger);
}

.content-area {
       display: grid;
       grid-template-columns: 1fr;
       gap: 24px;
       flex: 1;
}

@media (min-width: 768px) {
       .content-area {
              grid-template-columns: 1fr 1fr;
       }
}

.input-group {
       display: flex;
       flex-direction: column;
       gap: 12px;
       position: relative;
}

.group-header {
       display: flex;
       justify-content: space-between;
       align-items: center;
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
}

.styled-textarea:focus {
       border-color: var(--primary);
       box-shadow: 0 0 0 3px var(--primary-subtle);
}

.styled-textarea.result {
       background-color: var(--bg-body);
}

.copy-btn {
       border: none;
       background: none;
       color: var(--primary);
       font-size: 12px;
       font-weight: 600;
       cursor: pointer;
       transition: all 0.2s;
}

.copy-btn:hover {
       text-decoration: underline;
       color: var(--primary-hover);
}

.copy-btn.copied {
       color: var(--success);
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
}

.primary-btn:hover {
       background-color: var(--primary-hover);
       transform: translateY(-1px);
}

.primary-btn:active {
       transform: translateY(0);
}
</style>