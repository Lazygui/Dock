class EventEmitter<T extends Record<string, any>> {
       private listeners: {
              [K in keyof T]?: Set<Function>
       } = {}

       on<K extends keyof T>(eventName: K, listener: (data: T[K]) => void) {
              if (!this.listeners[eventName]) {
                     this.listeners[eventName] = new Set()
              }
              this.listeners[eventName]!.add(listener)
       }

       emit<K extends keyof T>(eventName: K, data?: T[K]) {
              const listeners = this.listeners[eventName]
              if (listeners) {
                     listeners.forEach(listener => listener(data))
              }
       }

       off<K extends keyof T>(eventName: K, listener: (data: T[K]) => void) {
              const listeners = this.listeners[eventName]
              if (listeners) {
                     listeners.delete(listener)
              }
       }

       offAll() {
              for (const key in this.listeners) {
                     const listeners = this.listeners[key as keyof T]
                     if (listeners) {
                            listeners.clear()
                     }
              }
       }
}
export default function mitt<T extends Record<string, any>>() {
       return new EventEmitter<T>()
}