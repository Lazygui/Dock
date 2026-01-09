import mermaid from 'mermaid';

// 初始化配置
mermaid.initialize({
       startOnLoad: false,
       theme: 'default',
       securityLevel: 'loose',
});

type CleanupFunction = () => void;

/**
 * 在指定的容器元素中渲染 Mermaid 图表，并提供基于 requestAnimationFrame 的高性能平移/缩放。
 */
export async function renderMermaidWithPanZoom(
       container: HTMLElement,
       graphString: string
): Promise<CleanupFunction> {
       // 1. 清空旧内容
       container.innerHTML = '';

       try {
              // 2. 渲染 SVG
              const uniqueId = `mermaid-${Date.now()}`;
              const { svg } = await mermaid.render(uniqueId, graphString);
              container.innerHTML = svg;

              const svgElement = container.querySelector('svg');
              if (!svgElement) {
                     throw new Error('Mermaid SVG element not found.');
              }

              // 3. 样式初始化 (启用 GPU 加速)
              container.style.overflow = 'hidden';
              container.style.cursor = 'grab';
              container.style.position = 'relative';

              svgElement.style.maxWidth = 'none';
              svgElement.style.height = 'auto';
              svgElement.style.display = 'block';
              svgElement.style.transformOrigin = '0 0';
              // 关键：告诉浏览器该元素即将发生变换，提前分配 GPU 层
              svgElement.style.willChange = 'transform';
              // 注意：移除 transition，完全交由 rAF 控制，避免拖拽时的“弹簧感”延迟

              // 4. 初始居中与自适应逻辑 (Auto-Fit & Center)
              const containerRect = container.getBoundingClientRect();
              const svgRect = svgElement.getBoundingClientRect();
              const padding = 40;

              const scaleX = (containerRect.width - padding) / svgRect.width;
              const scaleY = (containerRect.height - padding) / svgRect.height;

              // 限制初始缩放：最小自适应，最大不超过 1
              let scale = Math.min(scaleX, scaleY, 1);
              if (scale < 0.1) scale = 0.1;

              // 状态数据（Source of Truth）
              let translateX = (containerRect.width - svgRect.width * scale) / 2;
              let translateY = (containerRect.height - svgRect.height * scale) / 2;

              // 5. 渲染循环逻辑 (rAF)
              let isDragging = false;
              let startX = 0;
              let startY = 0;

              // rAF 锁：防止在一帧内重复调用渲染
              let rAFId: number | null = null;
              let isDirty = true; // 标记是否需要更新视图

              // 核心渲染函数：只负责“读”状态并“写”DOM
              const updateTransform = () => {
                     if (isDirty) {
                            // 使用 translate3d 强制启用硬件加速
                            svgElement.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
                            isDirty = false;
                     }
                     // 继续下一帧监听
                     rAFId = requestAnimationFrame(updateTransform);
              };

              // 启动渲染循环
              rAFId = requestAnimationFrame(updateTransform);

              // 6. 事件处理（只负责更新数据，不操作 DOM）

              const handleWheel = (event: WheelEvent) => {
                     event.preventDefault();

                     const scaleAmount = -event.deltaY * 0.001;
                     const newScale = Math.max(0.1, Math.min(10, scale + scaleAmount));

                     const rect = container.getBoundingClientRect();
                     const mouseX = event.clientX - rect.left;
                     const mouseY = event.clientY - rect.top;

                     // 更新坐标数据
                     translateX = mouseX - (mouseX - translateX) * (newScale / scale);
                     translateY = mouseY - (mouseY - translateY) * (newScale / scale);
                     scale = newScale;

                     isDirty = true; // 标记需要重绘
              };

              const handleMouseDown = (event: MouseEvent) => {
                     event.preventDefault();
                     isDragging = true;
                     startX = event.clientX - translateX;
                     startY = event.clientY - translateY;
                     container.style.cursor = 'grabbing';
              };

              const handleMouseMove = (event: MouseEvent) => {
                     if (!isDragging) return;
                     event.preventDefault();

                     // 更新坐标数据
                     translateX = event.clientX - startX;
                     translateY = event.clientY - startY;

                     isDirty = true; // 标记需要重绘
              };

              const stopDragging = () => {
                     if (!isDragging) return;
                     isDragging = false;
                     container.style.cursor = 'grab';
              };

              // 7. 绑定事件
              // 使用 { passive: false } 以便在 wheel 中调用 preventDefault
              container.addEventListener('wheel', handleWheel, { passive: false });
              container.addEventListener('mousedown', handleMouseDown);
              window.addEventListener('mousemove', handleMouseMove);
              window.addEventListener('mouseup', stopDragging);

              // 8. 清理函数
              const cleanup = () => {
                     // 停止渲染循环
                     if (rAFId !== null) {
                            cancelAnimationFrame(rAFId);
                     }

                     container.removeEventListener('wheel', handleWheel);
                     container.removeEventListener('mousedown', handleMouseDown);
                     window.removeEventListener('mousemove', handleMouseMove);
                     window.removeEventListener('mouseup', stopDragging);

                     container.style.cursor = 'default';
                     // 最好不要直接清空 container.innerHTML，
                     // 因为 Vue 可能正在进行卸载操作，交给 Vue 或父级去处理 DOM 销毁更安全
              };

              return cleanup;

       } catch (e: any) {
              console.error('Mermaid Render Error:', e);
              container.innerHTML = `<div style="color:red;padding:10px;">Render Error: ${e.message}</div>`;
              return () => { };
       }
}