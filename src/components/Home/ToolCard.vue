<template>
  <div class="tool-card">
    <div class="tool-card-icon">
      <i :class="tool.icon"></i>
    </div>
    <div class="tool-card-title">{{ tool.title }}</div>
    <div class="tool-card-desc">{{ tool.desc }}</div>
  </div>
</template>

<script setup lang="ts">
// 假设类型定义在 types.ts
export interface Tool {
  title: string;
  desc: string;
  icon: string;
  category: string;
}

defineProps<{ tool: Tool }>();
</script>

<style scoped>
.tool-card {
  background: var(--bg-card);
  /* 使用变量 */
  border-radius: var(--radius-box);
  padding: 24px;
  cursor: pointer;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  opacity: 0;
  animation: cardEntry 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  box-shadow: var(--shadow-sm);
  /* 使用变量 */
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
  /* 使用变量 */
  border-color: var(--border-hover);
  /* 使用变量 */
}

.tool-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--primary-subtle);
  /* 使用变量 */
  color: var(--primary);
  /* 使用变量 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 16px;
}

.tool-card-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-main);
  /* 使用变量 */
}

.tool-card-desc {
  font-size: 14px;
  color: var(--text-sub);
  /* 使用变量 */
  line-height: 1.5;
}

@keyframes cardEntry {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>