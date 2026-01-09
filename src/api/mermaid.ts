
import mermaid from 'mermaid';

/**
 * @typedef {() => void} CleanupFunction
 * A function that removes all event listeners created by the renderer.
 */

/**
 * 在指定的容器元素中渲染 Mermaid 图表，并为其提供平移和缩放功能。
 * @param {HTMLElement} container - 用于承载图表的容器DOM元素。
 * @param {string} graphString - Mermaid 语法的字符串。
 * @returns {Promise<CleanupFunction>} 一个 Promise，它解析后返回一个用于移除事件监听器的清理函数。
 */
export async function renderMermaidWithPanZoom(
       container: HTMLElement,
       graphString: string
): Promise<() => void> { // 返回值类型修改为 Promise<() => void>
       // ... (前面的渲染逻辑不变) ...
       container.innerHTML = '';
       try {
              const uniqueId = `mermaid-${Date.now()}`;
              const { svg } = await mermaid.render(uniqueId, graphString);
              container.innerHTML = svg;
              // 修正：将 transform 应用在 SVG 元素上或其直接父元素上
              const svgElement = container.querySelector('svg');
              if (!svgElement) {
                     throw new Error('Mermaid SVG element not found after rendering.');
              }
              const wrapper = svgElement.parentElement || container;

              // ... (样式设置不变) ...
              container.style.overflow = 'hidden';
              container.style.cursor = 'grab';
              wrapper.style.transformOrigin = '0 0';


              let scale: number = 1;
              let translateX: number = 0;
              let translateY: number = 0;
              let isDragging: boolean = false;
              let startX: number = 0;
              let startY: number = 0;

              const applyTransform = (): void => {
                     wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
              };

              // --- 将所有事件处理器提取为具名函数 ---

              const handleWheel = (event: WheelEvent): void => {
                     event.preventDefault();
                     // ... (缩放逻辑不变)
                     const scaleAmount: number = -event.deltaY * 0.001;
                     const newScale: number = Math.max(0.1, Math.min(10, scale + scaleAmount));
                     const rect: DOMRect = container.getBoundingClientRect();
                     const mouseX: number = event.clientX - rect.left;
                     const mouseY: number = event.clientY - rect.top;
                     translateX = mouseX - (mouseX - translateX) * (newScale / scale);
                     translateY = mouseY - (mouseY - translateY) * (newScale / scale);
                     scale = newScale;
                     applyTransform();
              };

              const handleMouseDown = (event: MouseEvent): void => {
                     event.preventDefault();
                     isDragging = true;
                     startX = event.clientX - translateX;
                     startY = event.clientY - translateY;
                     container.style.cursor = 'grabbing';
                     container.style.userSelect = 'none';
              };

              const handleMouseMove = (event: MouseEvent): void => {
                     if (!isDragging) return;
                     event.preventDefault();
                     translateX = event.clientX - startX;
                     translateY = event.clientY - startY;
                     applyTransform();
              };

              const stopDragging = (): void => {
                     if (!isDragging) return;
                     isDragging = false;
                     container.style.cursor = 'grab';
                     container.style.userSelect = '';
              };

              // --- 绑定事件 ---
              container.addEventListener('wheel', handleWheel);
              container.addEventListener('mousedown', handleMouseDown);
              container.addEventListener('mousemove', handleMouseMove);
              container.addEventListener('mouseup', stopDragging);
              container.addEventListener('mouseleave', stopDragging);

              applyTransform();

              // --- 创建并返回清理函数 ---
              const cleanup = (): void => {
                     container.removeEventListener('wheel', handleWheel);
                     container.removeEventListener('mousedown', handleMouseDown);
                     container.removeEventListener('mousemove', handleMouseMove);
                     container.removeEventListener('mouseup', stopDragging);
                     container.removeEventListener('mouseleave', stopDragging);
                     // 恢复容器的默认样式
                     container.style.cursor = 'default';
                     container.style.userSelect = '';
              };

              return cleanup; // 返回这个函数

       } catch (e: any) {
              console.error(e);
              container.innerHTML = `<pre style="color: red;">Mermaid 语法错误:\n${e.message}</pre>`;
              return () => { };
       }
}