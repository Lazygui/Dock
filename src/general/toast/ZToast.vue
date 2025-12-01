<!--
 * @FileDescription: 消息通知
 * @Author: zhouzhijun
 * @Date: 2025-5-7
 * @Version: 1.0.1
 * 1.0.0 /:实现消息通知组件的基本样式，位置上中，类型错误，动画开始结束过渡。
 * 1.0.1 /:通知窗口的位置增加 "top-left" | "top-center" | "top-right" 、支持使用Unicode图标。
 -->
<template>
       <div class="toaster_row" :id="`toaster_${props.id}`" :style="{
              transform: `translateY(${props.offset}px)`,
              justifyContent: justifyContent,
              top: topPosition ? '0px' : undefined,
              bottom: topPosition ? undefined : '0px'
       }">
              <div :style="{ ...props.style }" class="toaster_card"
                     :class="{ toaster_leave: !visible, toaster_enter: visible }">
                     <div class="toaster_Icon" v-if="!props.Unicode">
                            <div class="toaster_loading"></div>
                            <div class="toaster_type">
                                   <div class="toaster" :class="`${props.type}_Icon`"></div>
                            </div>
                     </div>
                     <div class="toaster_unicode" v-else>{{ props.Unicode }}</div>
                     <div role="status" aria-live="polite" class="toaster_message">{{ props.message }}</div>
              </div>
       </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

type ToasterType = "error" | "success" | "Unicode";
type ToasterPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
const props = withDefaults(
       defineProps<{
              id: string;
              offset: number;
              message: string;
              type: ToasterType;
              duration: number;
              Unicode?: string;
              style?: CSSStyleValue;
              position?: ToasterPosition;
       }>(),
       {
              position: "top-center"
       }
);
const visible = ref(true);
const justifyContent = computed(() => {
       if (props.position.includes("left")) {
              return "flex-start";
       } else if (props.position.includes("center")) {
              return "center";
       } else if (props.position.includes("right")) {
              return "flex-end";
       }
       return "center";
});
const topPosition = computed((): boolean => {
       return props.position.includes("top");
});
onMounted(async () => {
       setTimeout(() => {
              visible.value = false;
       }, props.duration);
});
</script>
<style lang="scss" scoped>
@use "./toastIcon.scss";
@use "./animation.scss";

.toaster_row {
       left: 0px;
       right: 0px;
       display: flex;
       position: absolute;
       transition: 230ms cubic-bezier(0.21, 1.02, 0.73, 1);
       z-index: 9999;

       .toaster_card {
              display: flex;
              align-items: center;
              background: #fff;
              color: #363636;
              line-height: 1.3;
              will-change: transform;
              box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
              max-width: 350px;
              pointer-events: auto;
              padding: 8px 10px;
              border-radius: 8px;

              .toaster_Icon {
                     position: relative;
                     display: flex;
                     justify-content: center;
                     align-items: center;
                     min-width: 20px;
                     min-height: 20px;

                     .toaster_loading {
                            width: 12px;
                            height: 12px;
                            box-sizing: border-box;
                            border: 2px solid;
                            border-radius: 100%;
                            border-color: #e0e0e0;
                            border-right-color: #616161;
                            animation: loading 1s linear infinite;
                     }

                     .toaster_type {
                            position: absolute;

                            .toaster {
                                   width: 20px;
                                   opacity: 0;
                                   height: 20px;
                                   border-radius: 10px;
                                   animation-delay: 100ms;
                                   position: relative;
                                   transform: rotate(45deg);
                            }
                     }

                     .toaster_unicode {
                            position: relative;
                            transform: scale(0.6);
                            opacity: 0.4;
                            min-width: 20px;
                            animation: unicode 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                     }
              }

              .toaster_message {
                     display: flex;
                     justify-content: center;
                     margin: 4px 10px;
                     color: inherit;
                     flex: 1 1 auto;
                     white-space: pre-line;
              }
       }
}

.toaster_leave {
       animation: 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) 0s 1 normal forwards running exitAnimation;
}

.toaster_enter {
       animation: 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) 0s 1 normal forwards running enterAnimation;
}
</style>
