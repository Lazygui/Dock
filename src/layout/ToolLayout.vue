<template>
  <div class="tool-wrapper">
    <div class="tool-container">

      <div class="layout-flex">
        <!-- 左侧侧边栏 -->
        <aside class="sidebar">
          <div class="back-btn" @click="goHome">
            <i class="ri-arrow-left-line"></i> 返回首页
          </div>

          <div class="sidebar-menu">
            <template v-for="(tools, categoryKey) in groupedTools" :key="categoryKey">
              <div class="menu-group-title">{{ getCategoryLabel(categoryKey) }}</div>

              <router-link v-for="tool in tools" :key="tool.path" :to="`/tools/${tool.path}`" class="menu-item"
                active-class="active">
                <i :class="tool.meta?.icon"></i>
                <span>{{ tool.meta?.title }}</span>
              </router-link>
            </template>
          </div>
        </aside>

        <!-- 右侧主内容区 -->
        <main class="main-content">
          <!-- 头部区域：合并了 v-if/v-else 的外层结构，方便放置右侧按钮 -->
          <div class="tool-header-detail">
            <!-- 左侧：动态内容 (图标 + 标题) -->
            <div class="header-left-group">
              <!-- Case A: 有具体工具 -->
              <template v-if="currentMeta">
                <div class="detail-icon">
                  <i :class="currentMeta.icon"></i>
                </div>
                <div class="detail-info">
                  <h2>{{ currentMeta.title }}</h2>
                  <p>{{ currentMeta.desc }}</p>
                </div>
              </template>

              <!-- Case B: 占位状态 -->
              <template v-else>
                <div class="detail-icon placeholder-icon">
                  <i class="ri-apps-line"></i>
                </div>
                <div class="detail-info">
                  <h2>工具箱首页</h2>
                  <p>请在左侧选择一个工具开始使用</p>
                </div>
              </template>
            </div>
          </div>

          <!-- 功能演示区域 -->
          <div class="tool-playground-wrapper">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { toolRoutes } from '@/router/tools';
import type { Meta } from '@/router/router.types';

const router = useRouter();
const route = useRoute();

// ... (其余原有逻辑保持不变)
const currentMeta = computed(() => {
  const meta = route.meta as unknown as Meta;
  if (meta && meta.title) {
    return meta;
  }
  return null;
});

const groupedTools = computed(() => {
  const groups: Record<string, typeof toolRoutes> = {};
  toolRoutes.forEach(child => {
    const meta = child.meta as unknown as Meta;
    if (!meta) return;
    const cat = meta.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(child);
  });
  return groups;
});

const categoryMap: Record<string, string> = {
  dev: '开发工具',
  network: '网络工具',
  crypto: '加密解密',
  convert: '格式转换',
  image: '图片工具'
};

const getCategoryLabel = (key: string | number) => {
  return categoryMap[key as string] || key;
};

const goHome = () => {
  router.push('/');
};
</script>

<style scoped lang="scss">
.tool-wrapper {
  width: 100%;
  height: 100%;
  background-color: var(--bg-body, #f8f9fa);
  overflow: hidden;

  .tool-container {
    margin: 0;
    padding: 20px;
    height: 100%;
    box-sizing: border-box;

    @media (max-width: 768px) {
      padding: 16px;
    }
  }
}

.layout-flex {
  display: flex;
  gap: 20px;
  height: 100%;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.sidebar {
  width: 260px;
  background: var(--bg-card, #ffffff);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm, 0 4px 20px rgba(0, 0, 0, 0.05));
  flex-shrink: 0;
  border: 1px solid var(--border, transparent);

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    max-height: 200px;
    overflow-y: auto;
  }
}

.main-content {
  flex: 1;
  background: var(--bg-card, #ffffff);
  border-radius: 16px;
  box-shadow: var(--shadow-sm, 0 4px 20px rgba(0, 0, 0, 0.05));
  padding: 30px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border, transparent);

  @media (max-width: 768px) {
    padding: 20px;
  }
}

/* --- 头部样式 (更新) --- */
.tool-header-detail {
  display: flex;
  align-items: center;
  /* 这里的 gap 仅用于最外层，实际间距由 margin-auto 控制 */
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border, rgba(0, 0, 0, 0.08));
  flex-shrink: 0;

  /* 确保 header 在移动端也能合理布局 */
  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
}

/* 新增：左侧内容包裹层，用于和右侧按钮分开 */
.header-left-group {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  /* 占据剩余空间 */
  min-width: 0;
  /* 防止文本过长溢出 */
}

/* 新增：主题按钮样式调整 */
.header-theme-btn {
  margin-left: auto;
  /* 关键：自动推到最右侧 */
  flex-shrink: 0;
}

/* 原有样式保持不变 */
.detail-icon {
  width: 56px;
  height: 56px;
  background: var(--primary-subtle, rgba(67, 97, 238, 0.1));
  color: var(--primary, #4361ee);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;

  &.placeholder-icon {
    background: var(--bg-hover, #f1f3f5);
    color: var(--text-sub, #adb5bd);
  }
}

.detail-info {
  h2 {
    font-size: 24px;
    margin-bottom: 4px;
    color: var(--text-main, #212529);
    margin-top: 0;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  p {
    color: var(--text-sub, #6c757d);
    font-size: 14px;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      white-space: normal;
      /* 移动端允许换行 */
    }
  }
}

.tool-playground-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;

  .fade-scale-enter-active,
  .fade-scale-leave-active {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .fade-scale-enter-from {
    opacity: 0;
    transform: scale(0.98);
    /* 稍微缩小进入 */
  }

  .fade-scale-leave-to {
    opacity: 0;
    transform: scale(1.02);
    /* 稍微放大消失 */
  }
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  margin-bottom: 20px;
  cursor: pointer;
  color: var(--text-sub, #6c757d);
  font-weight: 600;
  border-radius: 8px;
  transition: 0.2s;

  &:hover {
    background: var(--bg-hover, #f1f3f5);
    color: var(--text-main, #212529);
  }
}

.menu-group-title {
  font-size: 12px;
  color: var(--text-placeholder, #adb5bd);
  font-weight: 700;
  margin: 15px 0 8px 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-main, #212529);
  text-decoration: none;
  margin-bottom: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--primary-subtle, rgba(67, 97, 238, 0.05));
    color: var(--primary, #4361ee);
  }

  &.active {
    background: var(--primary, #4361ee);
    color: #ffffff;
    box-shadow: 0 4px 10px var(--primary-subtle, rgba(67, 97, 238, 0.3));
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>