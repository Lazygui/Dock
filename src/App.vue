<script setup lang="ts">
import { onUnmounted, computed } from 'vue'; // 引入 computed
import { mitter } from '@/hooks/mitter';
import { RouterView, useRoute } from 'vue-router'; // 引入 useRoute
import WindowHeader from '@/views/WindowHeader.vue';
import "./index"

const route = useRoute(); // 获取 route 实例

// 核心逻辑：计算全局路由的 Key
// 如果是 /tools/ping，matched[0].path 是 '/tools'
// 如果是 /tools/html-to-image，matched[0].path 依然是 '/tools'
// 这样 key 没变，ToolLayout 就不会重新渲染，侧边栏就不会动
const layoutKey = computed(() => {
  return route.matched[0]?.path || route.path;
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
  </div>
</template>

<style scoped lang="scss">
/* 应用最外层布局 */
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-body);
  /* 使用定义的背景色 */
  color: var(--text-main);
  overflow: hidden;
  /* 防止最外层滚动 */



  /* 内容区域容器 */
  .main-container {
    flex: 1;
    /* 占满剩余高度 */
    overflow: hidden;
    /* 内部滚动交给 RouterView 里的页面 */
    position: relative;
    /* 如果你的 RouterView 内容没有内边距，可以在这里加 padding */
    /* padding: 16px; */
  }

  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  /* 2. 进入时的初始状态 (透明 + 向下偏移) */
  .fade-slide-enter-from {
    opacity: 0;
    transform: translateY(10px);
  }

  /* 3. 离开时的结束状态 (透明 + 向上偏移) */
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>