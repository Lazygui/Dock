<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { mitter } from '@/hooks/mitter';
import { RouterView, useRoute } from 'vue-router';
import WindowHeader from '@/views/WindowHeader.vue';
import "./index"

const route = useRoute();

// --- 新增：更新检测逻辑 ---
const showUpdateModal = ref(false);
const updateInfo = ref<{ version: string; note: string; downloadUrl: string } | null>(null);

const checkUpdate = async () => {
  try {
    const res = await window.electronAPI.checkForUpdate();
    if (res.hasUpdate && res.version && res.downloadUrl) {
      updateInfo.value = {
        version: res.version,
        note: res.note || '暂无更新日志',
        downloadUrl: res.downloadUrl
      };
      showUpdateModal.value = true;
    }
  } catch (error) {
    console.error('检查更新出错:', error);
  }
};

const handleConfirmUpdate = () => {
  if (updateInfo.value?.downloadUrl) {
    window.electronAPI.openExternal(updateInfo.value.downloadUrl);
    showUpdateModal.value = false;
  }
};
// -----------------------

// 你的原有逻辑
const layoutKey = computed(() => {
  return route.matched[0]?.path || route.path;
});

onMounted(() => {
  // 启动时自动检查更新
  checkUpdate();
});

onUnmounted(() => {
  mitter.offAll();
});
</script>

<template>
  <div class="app-layout">
    <WindowHeader />

    <main class="main-container">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" :key="layoutKey" />
        </transition>
      </router-view>
    </main>

    <!-- 新增：更新弹窗 (放在最外层，fixed定位) -->
    <transition name="fade">
      <div v-if="showUpdateModal" class="update-modal-mask">
        <div class="update-modal">
          <div class="modal-header">
            <h3>🎉 发现新版本 {{ updateInfo?.version }}</h3>
          </div>
          <div class="modal-body">
            <pre>{{ updateInfo?.note }}</pre>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showUpdateModal = false">暂不更新</button>
            <button class="btn-confirm" @click="handleConfirmUpdate">去下载</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
/* 你的原有样式 */
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-body);
  color: var(--text-main);
  overflow: hidden;

  .main-container {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .fade-slide-enter-from {
    opacity: 0;
    transform: translateY(10px);
  }

  .fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

/* --- 新增：弹窗样式 --- */
.update-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  /* 简单淡入淡出 */
  &.fade-enter-active,
  &.fade-leave-active {
    transition: opacity 0.3s;
  }

  &.fade-enter-from,
  &.fade-leave-to {
    opacity: 0;
  }
}

.update-modal {
  background: var(--bg-body, #fff);
  /* 适配你的主题变量 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 400px;
  max-width: 90%;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 20px;
  display: flex;
  flex-direction: column;
  color: var(--text-main, #333);

  .modal-header h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
  }

  .modal-body {
    flex: 1;
    background: rgba(0, 0, 0, 0.05);
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
    max-height: 200px;
    overflow-y: auto;

    pre {
      white-space: pre-wrap;
      font-family: inherit;
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    button {
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.8;
      }
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid #666;
      color: var(--text-main);
    }

    .btn-confirm {
      background: #409eff;
      /* 或者你的主题色 */
      color: white;
    }
  }
}
</style>