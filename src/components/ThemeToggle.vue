<template>
       <!-- 关键点：传入 $event -->
       <button class="theme-btn" @click="toggleTheme($event)" :title="isDark ? '切换到亮色模式' : '切换到暗色模式'">
              <i v-if="isDark" class="ri-sun-line"></i>
              <i v-else class="ri-moon-line"></i>
       </button>
</template>

<script setup lang="ts">
import { useTheme } from '@/hooks';

const { isDark, toggleTheme } = useTheme();
</script>

<style scoped lang="scss">
.theme-btn {
       /* 尺寸调整：更小巧，适合标题栏 */
       width: 28px;
       height: 28px;

       /* 布局：居中图标 */
       display: flex;
       align-items: center;
       justify-content: center;

       /* 外观：默认透明，无边框 */
       background: transparent;
       border: none;
       border-radius: 4px;
       /* 微圆角，看起来像工具栏按钮 */

       /* 颜色：默认灰色，不抢眼 */
       color: var(--text-sub);
       font-size: 16px;
       /* 图标大小调整 */

       cursor: pointer;
       transition: all 0.2s ease;
       flex-shrink: 0;
       outline: none;
       /* 去除点击时的默认黑框 */



       /* 悬停效果：简单的背景色变化 */
       &:hover {
              background-color: var(--bg-hover);
              color: var(--text-main);
              /* 悬停时文字/图标变亮 */
       }

       /* 点击/激活效果 (可选) */
       &:active {
              transform: scale(0.95);
       }
}
</style>