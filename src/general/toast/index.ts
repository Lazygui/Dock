import { ref, render, createVNode } from "vue";
import ZToast from "./ZToast.vue";
// 类型工具：过滤掉必选属性，只保留可选属性
type OptionalProperties<T> = {
       [K in keyof T as T[K] extends Required<T>[K] ? never : K]: T[K];
};
type ToasterPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
interface ToasterOption {
       type: "error" | "success" | "warning" | "Unicode";
       duration: number;
       style?: Record<string, string>;
       Unicode?: string;
       position?: ToasterPosition;
}
/**
 * 唯一全局容器
 */
let toastContainer: HTMLElement | null = null;
const BASE_OFFEST = 5;
const toasts = ref<any[]>([]);
(() => {
       if (!toastContainer) {
              toastContainer = document.createElement("div");
              toastContainer.id = "_rht_toaster";
              toastContainer.style.position = "fixed";
              toastContainer.style.inset = "16px";
              toastContainer.style.zIndex = "9999";
              toastContainer.style.pointerEvents = "none";
              document.body.appendChild(toastContainer);
       }
})()

const showToast = async (message: string, options: ToasterOption) => {
       // 为弹窗分配一个唯一的 ID
       const id = Date.now().toString();

       const vnode = createVNode(ZToast, {
              id,
              message,
              offset: 0,
              leaveOffset: 0,
              ...options
       });
       // 创建一个容器来挂载虚拟节点
       const container = document.createElement("div");
       container.id = `toast-${id}`;

       // 将虚拟节点渲染到容器中
       render(vnode, container);

       if (toasts.value.length > 0) {
              updateOffsets();
       }

       toastContainer!.appendChild(container);
       toasts.value.unshift({ id, container, options });
       setTimeout(() => {
              // 从列表中移除当前弹窗
              toasts.value = toasts.value.filter((toast) => toast.id !== id);
              // 销毁组件并移除 DOM 节点
              render(null, container);
              container.remove();
       }, options.duration + 100);
};
const updateOffsets = () => {
       let totalOffset = 0;
       toasts.value.forEach((toast) => {
              const height = toast.container.firstElementChild.clientHeight;
              const vnode = createVNode(ZToast, {
                     message: toast.container.innerText || "",
                     id: toast.container.id,
                     offset: totalOffset + height + BASE_OFFEST,
                     ...toast.options
              });
              render(vnode, toast.container);
              totalOffset += height + BASE_OFFEST;
       });
};
type ExposeFunction = OptionalProperties<ToasterOption>;

const error = (message: string, options?: ExposeFunction) => showToast(message, { type: "error", duration: 3000, ...options });
const success = (message: string, options?: ExposeFunction) => showToast(message, { type: "success", duration: 3000, ...options });
const warning = (message: string, options?: ExposeFunction) => showToast(message, { type: "Unicode", Unicode: '⚠️', duration: 3000, ...options });

export default { error, success, warning };
