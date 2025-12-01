<template>
       <div class="converter-container">
              <!-- 核心操作区：位于右侧卡片标题下方 -->
              <div class="tool-content">

                     <!-- 1. 文件上传区域 (视觉重心) -->
                     <div class="upload-zone" @click="triggerFileInput" :class="{ 'is-dragover': isDragOver }"
                            @dragover.prevent="isDragOver = true" @dragleave.prevent="isDragOver = false"
                            @drop.prevent="handleDrop">

                            <input type="file" ref="fileInputRef" accept=".html,.htm" multiple class="hidden-input"
                                   @change="handleFileChange" />

                            <div class="upload-content">
                                   <div class="upload-icon">
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                 stroke-linecap="round" stroke-linejoin="round">
                                                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                 <polyline points="17 8 12 3 7 8" />
                                                 <line x1="12" y1="3" x2="12" y2="15" />
                                          </svg>
                                   </div>
                                   <div class="upload-text">
                                          <span class="main-text">点击或拖拽 HTML 文件到此处</span>
                                          <span class="sub-text">支持批量上传 / 自动解析资源</span>
                                   </div>
                            </div>
                     </div>

                     <!-- 2. 控制栏 & 状态栏 (上下布局或Flex布局) -->
                     <div class="control-bar">
                            <!-- 左侧：全局设置 -->
                            <div class="global-settings">
                                   <span class="label">输出格式：</span>
                                   <div class="select-wrapper">
                                          <select v-model="globalFormat" class="custom-select" :disabled="isProcessing"
                                                 @change="syncGlobalFormat">
                                                 <option value="jpg">JPG (推荐)</option>
                                                 <option value="png">PNG (透明/无损)</option>
                                                 <option value="webp">WebP (小体积)</option>
                                                 <option value="svg">SVG (矢量)</option>
                                          </select>
                                   </div>
                            </div>

                            <!-- 右侧：主操作按钮 -->
                            <div class="main-actions">
                                   <transition name="fade">
                                          <button v-if="hasResults && !isProcessing" @click="downloadAllZip"
                                                 class="btn btn-secondary icon-btn">
                                                 <span>📦 打包下载</span>
                                          </button>
                                   </transition>

                                   <button @click="startConversion" :disabled="isProcessing || queue.length === 0"
                                          class="btn btn-primary">
                                          <span v-if="isProcessing" class="spinner"></span>
                                          {{ isProcessing ? '处理中...' : '开始转换' }}
                                   </button>
                            </div>
                     </div>

                     <!-- 3. 任务列表区域 -->
                     <div class="queue-section">
                            <div class="section-header">
                                   <div class="header-left">
                                          <h4>转换队列</h4>
                                          <span class="badge" :class="globalStatus.code">{{ globalStatus.message
                                          }}</span>
                                   </div>
                                   <div class="header-right" v-if="queue.length > 0">
                                          <span class="counter">共 {{ queue.length }} 个文件</span>
                                   </div>
                            </div>

                            <div class="queue-list-wrapper">
                                   <div v-if="queue.length === 0" class="empty-state">
                                          <div class="empty-icon">☕</div>
                                          <p>暂无任务，请先添加文件</p>
                                   </div>

                                   <div v-else class="queue-list">
                                          <transition-group name="list">
                                                 <div v-for="(item, index) in queue" :key="index" class="queue-item">
                                                        <!-- 图标 -->
                                                        <div class="file-icon">📄</div>

                                                        <!-- 文件信息与进度 -->
                                                        <div class="file-details">
                                                               <div class="file-top">
                                                                      <span class="file-name" :title="item.file.name">{{
                                                                             item.file.name }}</span>
                                                                      <!-- 单个格式覆盖 -->
                                                                      <select v-model="item.format" class="mini-select"
                                                                             :disabled="isProcessing || item.status === 'success'"
                                                                             @click.stop>
                                                                             <option value="jpg">JPG</option>
                                                                             <option value="png">PNG</option>
                                                                             <option value="webp">WEBP</option>
                                                                             <option value="svg">SVG</option>
                                                                      </select>
                                                               </div>

                                                               <div class="progress-container">
                                                                      <div class="progress-bar-bg">
                                                                             <div class="progress-bar-fill"
                                                                                    :class="item.status"
                                                                                    :style="{ width: item.progress + '%' }">
                                                                             </div>
                                                                      </div>
                                                                      <span class="status-text" :class="item.status">{{
                                                                             item.statusText }}</span>
                                                               </div>
                                                        </div>

                                                        <!-- 单个下载动作 -->
                                                        <div class="item-actions">
                                                               <button class="action-btn" :disabled="!item.resultBlob"
                                                                      @click.stop="downloadSingle(item)" title="下载此图片">
                                                                      <svg viewBox="0 0 24 24" fill="none"
                                                                             stroke="currentColor" stroke-width="2"
                                                                             width="18" height="18">
                                                                             <path
                                                                                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                             <polyline points="7 10 12 15 17 10" />
                                                                             <line x1="12" y1="15" x2="12" y2="3" />
                                                                      </svg>
                                                               </button>
                                                        </div>
                                                 </div>
                                          </transition-group>
                                   </div>
                            </div>
                     </div>
              </div>

              <!-- 隐藏的渲染容器 (逻辑保持不变) -->
              <div class="render-container">
                     <iframe ref="iframeRef" class="render-frame"></iframe>
              </div>
       </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import JSZip from 'jszip';
import { snapdom } from '@zumer/snapdom';

type FormatType = 'jpg' | 'png' | 'webp' | 'svg';
type ProcessStatus = 'pending' | 'processing' | 'success' | 'failure';

interface QueueItem {
       file: File;
       format: FormatType;
       status: ProcessStatus;
       statusText: string;
       progress: number;
       resultBlob: Blob | string | null;
       resultFileName: string | null;
}

// --- State ---
const fileInputRef = ref<HTMLInputElement | null>(null);
const iframeRef = ref<HTMLIFrameElement | null>(null);
const globalFormat = ref<FormatType>('jpg');
const isProcessing = ref(false);
const queue = reactive<QueueItem[]>([]);
const zipInstance = ref<JSZip | null>(null);
const isDragOver = ref(false); // 新增：拖拽状态

// --- Computed ---
const globalStatus = computed(() => {
       if (queue.length === 0) return { code: 'idle', message: '等待文件' };
       if (isProcessing.value) return { code: 'processing', message: '处理中...' };
       const hasError = queue.some(i => i.status === 'failure');
       if (hasError) return { code: 'failure', message: '完成(含错误)' };
       const allSuccess = queue.every(i => i.status === 'success');
       if (allSuccess) return { code: 'success', message: '全部完成' };
       return { code: 'idle', message: '就绪' };
});

const hasResults = computed(() => {
       return queue.some(item => item.resultBlob !== null);
});

// --- Methods ---

const triggerFileInput = () => {
       if (!isProcessing.value) {
              fileInputRef.value?.click();
       }
};

const handleDrop = (e: DragEvent) => {
       isDragOver.value = false;
       if (isProcessing.value) return;
       const files = e.dataTransfer?.files;
       if (files && files.length > 0) processFiles(files);
};

const handleFileChange = (e: Event) => {
       const target = e.target as HTMLInputElement;
       if (target.files && target.files.length > 0) {
              processFiles(target.files);
       }
       target.value = '';
};

const processFiles = (fileList: FileList) => {
       queue.splice(0);
       zipInstance.value = new JSZip();

       Array.from(fileList).forEach(file => {
              // 简单过滤 html 文件
              if (file.type.includes('html') || file.name.match(/\.(html|htm)$/i)) {
                     queue.push({
                            file,
                            format: globalFormat.value,
                            status: 'pending',
                            statusText: '等待开始',
                            progress: 0,
                            resultBlob: null,
                            resultFileName: null
                     });
              }
       });
};

const syncGlobalFormat = () => {
       queue.forEach(item => {
              if (item.status === 'pending') {
                     item.format = globalFormat.value;
              }
       });
};

const readFileContent = (file: File): Promise<string> => {
       return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.onerror = (e) => reject(e);
              reader.readAsText(file);
       });
};

const startConversion = async () => {
       if (!snapdom) {
              alert('SnapDom 库未加载。');
              return;
       }

       isProcessing.value = true;
       const imgFolder = zipInstance.value?.folder("images");

       for (const item of queue) {
              if (item.status === 'success') continue;

              try {
                     item.status = 'processing';
                     item.statusText = '解析布局...';
                     item.progress = 10;

                     const htmlContent = await readFileContent(item.file);
                     const iframe = iframeRef.value;
                     if (!iframe) throw new Error("DOM Error");

                     // 重置 Iframe 尺寸以适应桌面端视口模拟
                     iframe.style.width = "1440px";
                     iframe.style.height = "1px"; // 先设小，让内容撑开

                     const doc = iframe.contentWindow?.document;
                     if (!doc) throw new Error("Iframe Doc Error");

                     doc.open();
                     doc.write(htmlContent);
                     doc.close();

                     // 样式重置，确保截图无白边
                     const styleReset = doc.createElement('style');
                     styleReset.innerHTML = `body{margin:0!important;padding:0!important;overflow:hidden;}::-webkit-scrollbar{display:none;}`;
                     doc.head.appendChild(styleReset);

                     item.progress = 30;
                     item.statusText = '加载资源...';

                     // 等待图片字体加载
                     await new Promise(r => setTimeout(r, 600));

                     const body = doc.body;
                     const html = doc.documentElement;
                     const width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
                     const height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);

                     // 调整 iframe 为实际内容大小
                     iframe.style.width = `${width}px`;
                     iframe.style.height = `${height}px`;

                     if (item.format !== 'svg') {
                            body.style.backgroundColor = "#ffffff";
                     }

                     item.progress = 60;
                     item.statusText = '生成中...';

                     const options = {
                            scale: 2,
                            quality: 0.95,
                            backgroundColor: '#ffffff',
                            embedFonts: true,
                            width: width,
                            height: height
                     };

                     let resultImgElement;
                     const fileNameBase = item.file.name.replace(/\.(html|htm)$/i, "");
                     let finalFileName = `${fileNameBase}.${item.format}`;

                     if (item.format === 'png') resultImgElement = await snapdom.toPng(body, options);
                     else if (item.format === 'webp') resultImgElement = await snapdom.toWebp(body, options);
                     else if (item.format === 'svg') resultImgElement = await snapdom.toSvg(body, { embedFonts: true });
                     else resultImgElement = await snapdom.toJpg(body, options);

                     const imgDataUrl = resultImgElement.src;
                     item.resultBlob = imgDataUrl;
                     item.resultFileName = finalFileName;

                     // 添加到 Zip
                     if (imgFolder) {
                            // 1. 安全地分割字符串
                            const parts = imgDataUrl.split(',');

                            // 2. 修复 TS 报错：如果数组为空或越界，给予空字符串默认值
                            const header = parts[0] || '';
                            const content = parts[1] || '';

                            // 3. 判断是否为 Base64 格式
                            // header 类似 "data:image/png;base64"
                            const isBase64 = header.includes(';base64');

                            if (isBase64 && content) {
                                   // 如果是 Base64，直接写入
                                   imgFolder.file(finalFileName, content, { base64: true });
                            } else if (content) {
                                   // 4. 如果不是 Base64 (通常是 SVG 的 URI 编码)，解码并作为纯文本写入
                                   // decodeURIComponent 需要确保传入的是 string，content 已经是 string 了
                                   try {
                                          const raw = decodeURIComponent(content);
                                          imgFolder.file(finalFileName, raw);
                                   } catch (err) {
                                          console.error('解码 SVG 失败:', err);
                                          // 兜底：如果解码失败，直接写入原始内容，防止文件丢失
                                          imgFolder.file(finalFileName, content);
                                   }
                            }
                     }

                     item.progress = 100;
                     item.status = 'success';
                     item.statusText = '完成';

              } catch (e) {
                     console.error(e);
                     item.status = 'failure';
                     item.statusText = '失败';
                     item.progress = 100;
              }
       }
       isProcessing.value = false;
};

const downloadSingle = (item: QueueItem) => {
       if (item.resultBlob && item.resultFileName) {
              const link = document.createElement('a');
              link.href = item.resultBlob as string;
              link.download = item.resultFileName;
              link.click();
       }
};

const downloadAllZip = () => {
       zipInstance.value?.generateAsync({ type: "blob" }).then((content) => {
              const link = document.createElement('a');
              link.href = URL.createObjectURL(content);
              link.download = `html_images_${new Date().getTime()}.zip`;
              link.click();
       });
};
</script>

<style scoped lang="scss">
/* 复用变量 */
.converter-container {
       height: 100%;
       display: flex;
       flex-direction: column;
       overflow: hidden;
}

/* 隐藏渲染层 */
.render-container {
       position: fixed;
       left: -9999px;
       top: 0;
       z-index: -1;
       width: 1440px;
       height: 100vh;
       overflow: hidden;

       .render-frame {
              width: 100%;
              height: 100%;
              border: none;
              background: #fff;
       }
}

/* --- 工具主区域样式 --- */
.tool-content {
       display: flex;
       flex-direction: column;
       gap: 20px;
       max-width: 1000px;
       margin: 0 auto;
       width: 100%;
       height: 100%;
       /* 关键：占满父容器高度 */
       padding-bottom: 20px;
       /* 底部留点空隙 */
}

/* 1. 上传区域 */
.upload-zone {
       background-color: var(--bg-card);
       border: 2px dashed var(--border);
       border-radius: var(--radius-box);
       padding: 40px 20px;
       text-align: center;
       cursor: pointer;
       transition: all 0.3s ease;
       position: relative;
       overflow: hidden;

       &:hover,
       &.is-dragover {
              border-color: var(--primary);
              background-color: var(--primary-subtle);

              .upload-icon {
                     color: var(--primary);
                     transform: scale(1.1);
              }
       }

       .hidden-input {
              display: none;
       }

       .upload-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 12px;
       }

       .upload-icon {
              width: 48px;
              height: 48px;
              color: var(--text-placeholder);
              transition: all 0.3s;

              svg {
                     width: 100%;
                     height: 100%;
              }
       }

       .upload-text {
              display: flex;
              flex-direction: column;
              gap: 4px;

              .main-text {
                     font-size: 16px;
                     font-weight: 600;
                     color: var(--text-main);
              }

              .sub-text {
                     font-size: 13px;
                     color: var(--text-sub);
              }
       }
}

/* 2. 控制栏 */
.control-bar {
       display: flex;
       justify-content: space-between;
       align-items: center;
       background-color: var(--bg-card);
       padding: 16px 20px;
       border-radius: var(--radius-box);
       border: 1px solid var(--border);
       box-shadow: var(--shadow-sm);
}

.global-settings {
       display: flex;
       align-items: center;
       gap: 10px;

       .label {
              font-size: 14px;
              color: var(--text-sub);
       }

       .custom-select {
              padding: 8px 12px;
              border-radius: 8px;
              border: 1px solid var(--border);
              background-color: var(--bg-input);
              color: var(--text-main);
              font-size: 14px;
              outline: none;
              cursor: pointer;
              transition: border-color 0.2s;

              &:hover {
                     border-color: var(--border-hover);
              }

              &:focus {
                     border-color: var(--primary);
              }
       }
}

.main-actions {
       display: flex;
       gap: 12px;

       .btn {
              height: 40px;
              padding: 0 20px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              border: none;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s;

              &:disabled {
                     opacity: 0.6;
                     cursor: not-allowed;
              }

              &.btn-primary {
                     background-color: var(--primary);
                     color: #fff;

                     &:hover:not(:disabled) {
                            background-color: var(--primary-hover);
                            box-shadow: var(--shadow-hover);
                     }
              }

              &.btn-secondary {
                     background-color: var(--success-bg);
                     color: var(--success);

                     &:hover:not(:disabled) {
                            background-color: var(--success);
                            color: #fff;
                     }
              }
       }

       .spinner {
              width: 14px;
              height: 14px;
              border: 2px solid #fff;
              border-top-color: transparent;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
       }
}

/* 3. 队列列表 */
.queue-section {
       background-color: var(--bg-card);
       border-radius: var(--radius-box);
       border: 1px solid var(--border);

       /* --- 关键布局修改 --- */
       flex: 1;
       /* 自动占据剩余高度 */
       min-height: 0;
       /* 核心：允许 flex 项目压缩，触发布局计算 */
       display: flex;
       /* 变成 flex 容器 */
       flex-direction: column;
       /* ------------------ */

       overflow: hidden;
}

.section-header {
       padding: 16px 20px;
       border-bottom: 1px solid var(--border);
       display: flex;
       justify-content: space-between;
       align-items: center;
       background-color: var(--bg-hover);

       h4 {
              margin: 0;
              font-size: 15px;
              color: var(--text-main);
       }

       .header-left {
              display: flex;
              align-items: center;
              gap: 12px;
       }

       .badge {
              font-size: 12px;
              padding: 2px 8px;
              border-radius: 10px;

              &.idle {
                     background: var(--bg-body);
                     color: var(--text-sub);
              }

              &.processing {
                     background: var(--primary-subtle);
                     color: var(--primary);
              }

              &.success {
                     background: var(--success-bg);
                     color: var(--success);
              }

              &.failure {
                     background: var(--danger-bg);
                     color: var(--danger);
              }
       }

       .counter {
              font-size: 12px;
              color: var(--text-sub);
       }
}

.queue-list-wrapper {
       padding: 10px;

       /* --- 关键布局修改 --- */
       flex: 1;
       /* 撑满 .queue-section 的剩余空间 */
       overflow-y: auto;
       /* 超出部分滚动 */
       /* ------------------ */

       /* 滚动条美化保持不变 */
       &::-webkit-scrollbar {
              width: 6px;
       }

       &::-webkit-scrollbar-thumb {
              background-color: var(--border);
              border-radius: 10px;
       }
}

.empty-state {
       display: flex;
       flex-direction: column;
       align-items: center;
       justify-content: center;
       padding: 60px 0;
       color: var(--text-placeholder);

       .empty-icon {
              font-size: 40px;
              margin-bottom: 10px;
              opacity: 0.5;
       }
}

.queue-item {
       display: flex;
       align-items: center;
       padding: 12px;
       margin-bottom: 8px;
       background-color: var(--bg-body);
       border-radius: 8px;
       border: 1px solid transparent;
       transition: all 0.2s;

       &:hover {
              border-color: var(--border-hover);
              background-color: #fff;
              box-shadow: var(--shadow-card);
       }

       .file-icon {
              font-size: 20px;
              margin-right: 12px;
              opacity: 0.7;
       }

       .file-details {
              flex: 1;
              min-width: 0;
              /* 允许子元素截断 */

              .file-top {
                     display: flex;
                     justify-content: space-between;
                     margin-bottom: 6px;

                     .file-name {
                            font-size: 14px;
                            font-weight: 500;
                            color: var(--text-main);
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            max-width: 70%;
                     }

                     .mini-select {
                            font-size: 11px;
                            padding: 0 4px;
                            border: 1px solid var(--border);
                            border-radius: 4px;
                            background: transparent;
                            color: var(--text-sub);

                            &:focus {
                                   border-color: var(--primary);
                            }
                     }
              }
       }

       .progress-container {
              display: flex;
              align-items: center;
              gap: 10px;

              .progress-bar-bg {
                     flex: 1;
                     height: 4px;
                     background-color: var(--border);
                     border-radius: 2px;
                     overflow: hidden;

                     .progress-bar-fill {
                            height: 100%;
                            width: 0;
                            background-color: var(--primary);
                            transition: width 0.3s;

                            &.success {
                                   background-color: var(--success);
                            }

                            &.failure {
                                   background-color: var(--danger);
                            }
                     }
              }

              .status-text {
                     font-size: 11px;
                     width: 50px;
                     text-align: right;

                     &.success {
                            color: var(--success);
                     }

                     &.failure {
                            color: var(--danger);
                     }

                     &.processing {
                            color: var(--primary);
                     }

                     &.pending {
                            color: var(--text-placeholder);
                     }
              }
       }

       .item-actions {
              margin-left: 12px;

              .action-btn {
                     width: 32px;
                     height: 32px;
                     border: none;
                     background: transparent;
                     color: var(--text-sub);
                     border-radius: 6px;
                     cursor: pointer;
                     display: flex;
                     align-items: center;
                     justify-content: center;
                     transition: all 0.2s;

                     &:hover:not(:disabled) {
                            background-color: var(--bg-hover);
                            color: var(--primary);
                     }

                     &:disabled {
                            opacity: 0.3;
                            cursor: default;
                     }
              }
       }
}

@keyframes spin {
       from {
              transform: rotate(0deg);
       }

       to {
              transform: rotate(360deg);
       }
}

/* 列表进入动画 */
.list-enter-active,
.list-leave-active {
       transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
       opacity: 0;
       transform: translateX(20px);
}

.fade-enter-active,
.fade-leave-active {
       transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
       opacity: 0;
}
</style>