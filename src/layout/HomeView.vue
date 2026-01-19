<template>
  <div class="app-wrapper">
    <div class="app-container fade-in">
      <!-- 头部与搜索 -->
      <div class="tool-header">
        <div class="search-wrapper">
          <i class="ri-search-line search-icon"></i>
          <input type="text" class="search-input" placeholder="搜索工具..." v-model="searchQuery">
        </div>
        <div class="header-top-mobile">
          <h1 class="header-title">Developer Toolbox</h1>
        </div>
      </div>

      <!-- 分类 Tabs -->
      <div class="category-tabs-wrapper">
        <div class="category-tabs">
          <div v-for="cat in categories" :key="cat.id" class="category-tab"
            :class="{ active: currentCategory === cat.id }" @click="setCategory(cat.id)">
            {{ cat.name }}
          </div>
        </div>
      </div>

      <!-- 工具列表网格 -->
      <div class="tool-grid">
        <template v-if="filteredTools.length > 0">
          <ToolCard v-for="(tool, index) in filteredTools" :key="tool.path" :tool="(tool.meta as unknown as Tool)"
            :style="{ animationDelay: `${index * 0.05}s` }" @click="handleToolClick(tool.path)" />
        </template>

        <div v-else class="empty-state">
          <i class="ri-inbox-line" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
          没有找到与 "{{ searchQuery }}" 相关的工具
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ToolCard, { type Tool } from '@/components/Home/ToolCard.vue';
import { toolRoutes, categories } from '@/router/tools';
import { mitter } from '@/hooks';

const currentCategory = ref<string>('all');
const searchQuery = ref<string>('');

// 计算属性：基于路由配置过滤工具
const filteredTools = computed(() => {
  return toolRoutes.filter(route => {
    const meta = route.meta || {};
    // 1. 过滤分类
    const matchCat = currentCategory.value === 'all' || meta.category === currentCategory.value;

    // 2. 过滤搜索关键词
    const query = searchQuery.value.toLowerCase();
    const matchSearch = (meta.title as string)?.toLowerCase().includes(query) ||
      (meta.desc as string)?.toLowerCase().includes(query);

    return matchCat && matchSearch;
  })
});

const setCategory = (id: string) => { currentCategory.value = id; };

// 点击跳转：直接使用 router.push
const handleToolClick = (path: string) => {
  mitter.emit('ROUTE:PUSH', {
    path: `/tools/${path}`,
    body: {}
  });
};
</script>

<style scoped lang="scss">
/* Firefox 适配 */
.app-wrapper,
.category-tabs {
  scrollbar-width: thin;
  scrollbar-color: var(--border, #ccc) transparent;
}

/* --- 动画定义 --- */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}

/* --- 主布局结构 --- */
.app-wrapper {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  /* 防止横向溢出 */

  .app-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;

    @media (max-width: 768px) {
      padding: 16px;
    }


    /* --- 头部区域 --- */
    .tool-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      gap: 20px;
      flex-wrap: wrap;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
        margin-bottom: 20px;
      }

      /* 搜索框容器 */
      .search-wrapper {
        position: relative;
        width: 100%;
        max-width: 300px;
        min-width: 200px;

        @media (max-width: 768px) {
          max-width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-sub);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 12px 20px 12px 45px;
          border: 2px solid transparent;
          background: var(--bg-input);
          color: var(--text-main);
          border-radius: 20px;
          font-size: 14px;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s;
          outline: none;
          box-sizing: border-box;

          &::placeholder {
            color: var(--text-placeholder);
          }

          &:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 4px var(--primary-subtle);
          }
        }
      }

      /* 移动端顶部 (标题 + 主题按钮) */
      .header-top-mobile {
        display: flex;
        align-items: center;
        gap: 15px;

        @media (max-width: 768px) {
          justify-content: space-between;
          width: 100%;
        }

        .header-title {
          font-size: clamp(24px, 4vw, 28px);
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.5px;
          white-space: nowrap;

          @media (max-width: 768px) {
            flex: 1;
            text-align: left;
            margin: 0;
          }
        }

        .header-theme-btn {
          @media (max-width: 768px) {
            margin-left: 10px;
          }
        }
      }
    }

    /* --- 分类 Tabs 区域 --- */
    .category-tabs-wrapper {
      margin: 0 -20px 30px -20px;
      padding: 0 20px;
      overflow: hidden;

      @media (max-width: 768px) {
        margin: 0 -16px 20px -16px;
        padding: 0 16px;
      }

      .category-tabs {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding: 4px;
        -webkit-overflow-scrolling: touch;

        .category-tab {
          padding: 8px 20px;
          background: var(--bg-card);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          color: var(--text-sub);
          box-shadow: var(--shadow-sm);
          transition: all 0.2s ease;
          user-select: none;
          flex-shrink: 0;

          &:hover {
            transform: translateY(-2px);
            color: var(--primary);
            background: var(--bg-hover);
          }

          &.active {
            background: var(--primary);
            color: #ffffff;
            box-shadow: 0 4px 15px var(--primary-subtle);
          }
        }
      }
    }

    /* --- 工具网格区域 --- */
    .tool-grid {
      display: grid;
      /* 智能响应式列宽：最小 300px，若屏幕不够则 100% */
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
      gap: 20px;
      width: 100%;

      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: var(--text-placeholder);
        display: flex;
        flex-direction: column;
        align-items: center;
        word-break: break-word;
      }
    }
  }
}
</style>