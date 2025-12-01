import mitt from './private/mitt'
interface PUSH {
       path: string
       body?: {
              [key: string]: any
       }

}
type Events = {
       // 路由跳转
       'ROUTE:PUSH': PUSH
       // 路由跳转失败_参数为空
       'ROUTE:ERROR_PUSH_NULL': void
}

export const mitter = mitt<Events>()
