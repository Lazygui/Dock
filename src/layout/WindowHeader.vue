<script setup lang="ts">
import { ref } from 'vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

// 模拟菜单数据
const menus = ref([
  {
    label: '文件',
    key: 'file',
    children: ['新建连接', '导入配置', '设置', '退出']
  },
  {
    label: '工具',
    key: 'tools',
    children: ['JSON格式化', 'Ping测试', '编码转换']
  },
  {
    label: '帮助',
    key: 'help',
    children: ['检查更新', '关于']
  }
])
const isClosing = ref(false)
const activeMenuIndex = ref<number | null>(null)

// 窗口控制逻辑
const handleMinimize = () => {
  window.electronAPI?.minimize()
}

const handleClose = () => {
  if (isClosing.value) return
  isClosing.value = true

  // 1. 给 body 添加关闭动画类名
  document.body.classList.add('app-closing')

  // 2. 等待动画播放完毕 (例如 300ms) 后再真正关闭
  // @ts-ignore
  window.electronAPI?.close()
}
// 简单的点击处理（预留）
const handleMenuClick = (action: string) => {
  console.log('Menu action:', action)
  activeMenuIndex.value = null // 点击后关闭菜单
}
</script>

<template>
  <header class="window-header">
    <!-- 左侧区域：Logo + 菜单 -->
    <div class="header-left">
      <!-- Logo 图标 -->
      <div class="app-icon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path
            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z">
          </path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </div>

      <!-- 菜单栏 -->
      <nav class="menu-bar">
        <div v-for="(menu, index) in menus" :key="menu.key" class="menu-item"
          :class="{ 'is-active': activeMenuIndex === index }" @mouseenter="activeMenuIndex = index"
          @mouseleave="activeMenuIndex = null">
          <span class="menu-label">{{ menu.label }}</span>

          <!-- 下拉菜单 -->
          <transition name="fade">
            <div class="dropdown-menu" v-if="activeMenuIndex === index">
              <div v-for="item in menu.children" :key="item" class="dropdown-item" @click.stop="handleMenuClick(item)">
                {{ item }}
              </div>
            </div>
          </transition>
        </div>
      </nav>
    </div>

    <!-- 中间拖拽区 (占位) -->
    <div class="header-drag-area"></div>

    <!-- 右侧：窗口控制按钮 -->
    <div class="header-right">

      <!-- 功能按钮区 -->
      <div class="action-btn-group">
        <!-- 这里放置主题切换按钮 -->
        <!-- 注意：需要在 ThemeToggle 组件内确保它也是垂直居中的，或者在这里包裹一层 -->
        <div class="theme-switch-wrapper">
          <ThemeToggle />
        </div>
      </div>

      <!-- 分割线 (可选) -->
      <div class="divider"></div>

      <!-- 窗口控制区 -->
      <div class="window-controls">
        <button class="control-btn min-btn" @click="handleMinimize" title="最小化">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect width="10" height="1" y="4.5" fill="currentColor" />
          </svg>
        </button>
        <button class="control-btn close-btn" @click="handleClose" title="关闭">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.2" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* 头部容器 */
.window-header {
  height: 42px;
  /* 稍微增加一点高度以适应现代感 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border);
  box-sizing: border-box;
  -webkit-app-region: drag;
  /* 允许拖拽 */
  position: relative;
  z-index: 50;
  /* 确保菜单在最上层 */
  padding: 0 0 0 12px;
}

/* 左侧布局 */
.header-left {
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
  /* 区域内元素不可拖拽，保证交互 */
}

/* Logo */
.app-icon {
  color: var(--primary);
  display: flex;
  align-items: center;
  margin-right: 16px;
}

/* 菜单栏 */
.menu-bar {
  display: flex;
  height: 100%;
}

.menu-item {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-sub);
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 4px 0;
  /* 这里的margin是为了让hover背景不贴顶 */
  height: calc(100% - 8px);
}

.menu-item:hover,
.menu-item.is-active {
  background-color: var(--bg-hover);
  color: var(--text-main);
}

.menu-item.is-active {
  color: var(--primary);
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  top: 100%;
  /* 相对于 menu-item 底部 */
  left: 0;
  margin-top: 4px;
  /* 稍微留点空隙 */
  min-width: 140px;
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
  border-radius: 8px;
  /* 使用比主卡片小一点的圆角 */
  padding: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dropdown-item {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-main);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.dropdown-item:hover {
  background-color: var(--primary-subtle);
  color: var(--primary);
}

/* 中间区域 */
.header-drag-area {
  flex: 1;
  height: 100%;
}

/* 右侧控制区 */

.header-right {
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
  /* 整个右侧区域不可拖拽，保证点击 */
}

/* 主题按钮容器 */
.theme-switch-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 12px;
  /* 给主题按钮两边一点呼吸空间 */
  color: var(--text-sub);
  transition: color 0.2s;
}

.theme-switch-wrapper:hover {
  color: var(--text-main);
}

/* 竖向分割线 */
.divider {
  width: 1px;
  height: 16px;
  background-color: var(--border);
  margin: 0 4px;
}

.window-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.control-btn {
  border: none;
  background: transparent;
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-sub);
  transition: all 0.2s;
  outline: none;
}

.min-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-main);
}

.close-btn:hover {
  background-color: #ff4d4f;
  /* 关闭按钮通常保留红色警示 */
  color: white;
}

/* 简单的淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>