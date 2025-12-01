<template>
       <div class="ping-container">
              <!-- 输入卡片 -->
              <div class="card">
                     <div class="input-section">
                            <div class="input-wrapper">
                                   <input type="text" v-model="ipAddress" class="input-field"
                                          placeholder="请输入 IP 地址或域名，例如: 8.8.8.8" :disabled="isPinging" />
                            </div>
                            <div class="input-wrapper">
                                   <input type="number" v-model="port" class="input-field port-input"
                                          placeholder="端口 (可选)" :disabled="isPinging" />
                            </div>
                            <button @click="startPing" :disabled="isPinging" class="start-button">
                                   {{ isPinging ? '测试中...' : '开始测试' }}
                            </button>
                     </div>
              </div>

              <!-- 结果展示卡片 -->
              <div class="card results-section">
                     <div class="results-header">
                            <h3>测试结果</h3>
                            <span :class="['status-badge', status.code]">
                                   {{ status.message }}
                            </span>
                     </div>
                     <pre id="results-log" class="results-log">{{ logs }}</pre>
              </div>
       </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

type Status = {
       code: 'pending' | 'success' | 'failure';
       message: string;
};

// --- Reactive State ---
const ipAddress = ref('127.0.0.1');
const port = ref('');
const logs = ref('请点击“开始测试”以查看结果...');
const isPinging = ref(false);
const status = ref<Status>({ code: 'pending', message: '等待测试' });

let cleanupListener: (() => void) | null = null;

// --- Methods ---
const startPing = () => {
       // [安全] 防抖检查：如果正在测试，直接拦截
       if (isPinging.value) return;

       if (!ipAddress.value.trim()) {
              alert('请输入有效的 IP 地址或域名!');
              return;
       }

       isPinging.value = true;
       logs.value = ''; // 清空旧日志

       // 本地先置为 pending，响应更及时
       status.value = { code: 'pending', message: '测试中...' };

       // 调用 Electron 主进程
       window.electronAPI.startPing({ ip: ipAddress.value, port: port.value });
};

const appendLog = (message: string) => {
       logs.value += message + '\n';
       // 自动滚动到底部
       nextTick(() => {
              const logEl = document.getElementById('results-log');
              if (logEl) {
                     logEl.scrollTop = logEl.scrollHeight;
              }
       });
};

// --- Lifecycle Hooks ---
onMounted(() => {
       // 注册监听器，接收来自主进程的消息
       cleanupListener = window.electronAPI.onPingReply((data) => {
              if (data.type === 'log') {
                     appendLog(data.payload);
              } else if (data.type === 'status') {
                     status.value = data.payload;

                     // [核心修复] 
                     // 后端一开始会发 'pending' 状态，此时不能解锁按钮。
                     // 只有当收到 'success' 或 'failure' (即非 pending) 时，才认为测试结束。
                     if (data.payload.code !== 'pending') {
                            isPinging.value = false;
                     }
              }
       });
});

onUnmounted(() => {
       // 组件卸载时，清理监听器以防内存泄漏
       if (cleanupListener) {
              cleanupListener();
       }
});
</script>

<style scoped lang="scss">
.ping-container {
       max-width: 800px;
       height: 100%;
       margin: 0 auto;
       display: flex;
       flex-direction: column;
       gap: 24px;
       padding-bottom: 24px;

       .card {
              background-color: var(--bg-card);
              border-radius: var(--radius-box);
              box-shadow: var(--shadow-card);
              padding: 24px;
              border: 1px solid var(--border);
              transition: box-shadow 0.3s, border-color 0.3s;

              &:hover {
                     box-shadow: var(--shadow-hover);
              }

              .input-section {
                     display: flex;
                     gap: 16px;
                     align-items: center;

                     .input-wrapper {
                            flex-grow: 1;
                            position: relative;



                            .input-field {
                                   width: 100%;
                                   height: 48px;
                                   padding: 0 16px;
                                   font-size: 16px;
                                   background-color: var(--bg-input);
                                   color: var(--text-main);
                                   border: 1px solid var(--border);
                                   border-radius: 10px;
                                   transition: border-color 0.3s, box-shadow 0.3s;



                                   &::placeholder {
                                          color: var(--text-placeholder);
                                   }

                                   &:focus {
                                          outline: none;
                                          border-color: var(--border-hover);
                                          box-shadow: 0 0 0 3px var(--primary-subtle);
                                   }

                                   &:disabled {
                                          background-color: var(--bg-body);
                                          cursor: not-allowed;
                                          opacity: 0.7;
                                   }
                            }

                            .port-input {
                                   width: 150px;
                            }
                     }

                     .start-button {
                            user-select: none;
                            height: 48px;
                            padding: 0 24px;
                            border: none;
                            border-radius: 10px;
                            background-color: var(--primary);
                            color: white;
                            font-size: 16px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: background-color 0.3s, transform 0.2s, box-shadow 0.3s, opacity 0.3s;
                            white-space: nowrap;
                            min-width: 120px;



                            &:hover {
                                   background-color: var(--primary-hover);
                                   box-shadow: var(--shadow-hover);
                                   transform: translateY(-2px);
                            }

                            &:disabled {
                                   opacity: 0.6;
                                   cursor: not-allowed;
                                   transform: none;
                                   box-shadow: none;
                                   pointer-events: none;
                                   background-color: var(--text-placeholder);
                            }
                     }
              }

              .results-header {
                     user-select: none;
                     display: flex;
                     justify-content: space-between;
                     align-items: center;
                     margin-bottom: 20px;
                     color: var(--text-sub);
                     flex-shrink: 0;

                     .status-badge {
                            padding: 6px 12px;
                            border-radius: 20px;
                            font-weight: 500;
                            font-size: 14px;

                            &.success {
                                   background-color: var(--success-bg);
                                   color: var(--success);
                            }

                            &.failure {
                                   background-color: var(--danger-bg);
                                   color: var(--danger);
                            }

                            &.pending {
                                   background-color: var(--warning-bg);
                                   color: var(--warning);
                            }
                     }
              }

              .results-log {
                     background-color: var(--bg-body);
                     border-radius: 10px;
                     padding: 16px;
                     height: auto;
                     flex: 1;
                     overflow-y: auto;

                     font-family: "SF Mono", "Fira Code", "Consolas", monospace;
                     font-size: 14px;
                     color: var(--text-sub);
                     border: 1px solid var(--border);
                     white-space: pre-wrap;

                     &::-webkit-scrollbar {
                            width: 6px;
                     }

                     &::-webkit-scrollbar-track {
                            background: transparent;
                     }

                     &::-webkit-scrollbar-thumb {
                            background-color: var(--border);
                            border-radius: 10px;
                     }
              }
       }

       .results-section {
              flex: 1;
              min-height: 0;
              display: flex;
              flex-direction: column;
       }
}
</style>