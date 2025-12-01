// src/hooks/useTheme.ts
import { ref, onMounted, nextTick } from 'vue';

export function useTheme() {
  const isDark = ref(false);

  const updateDOM = () => {
    const html = document.documentElement;
    if (isDark.value) {
      html.setAttribute('data-theme', 'dark');
      html.classList.add('dark');
    } else {
      html.removeAttribute('data-theme');
      html.classList.remove('dark');
    }
  };

  const toggleTheme = async (event?: MouseEvent) => {
    // 1. 兼容性检查
    // @ts-ignore
    if (!document.startViewTransition) {
      isDark.value = !isDark.value;
      updateDOM();
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // 记录“是否正在变暗”
    const isGoingDark = !isDark.value;

    // @ts-ignore
    const transition = document.startViewTransition(async () => {
      isDark.value = !isDark.value;
      updateDOM();
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
      await nextTick();
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          // 变暗：从小圆 -> 大圆
          // 变亮：从大圆 -> 小圆
          clipPath: isGoingDark ? clipPath : [...clipPath].reverse(),
        },
        {
          duration: 400,
          easing: 'ease-in',

          // === 关键修复 ===
          // 必须加这个！防止动画结束后瞬间还原成全屏截图导致闪烁
          fill: 'forwards',

          pseudoElement: isGoingDark
            ? '::view-transition-new(root)'
            : '::view-transition-old(root)',
        }
      );
    });
  };

  onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDark.value = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    updateDOM();
  });

  return { isDark, toggleTheme };
}