export interface Meta {
       /**
        * 工具名称
        */
       title: string
       /**
        * 工具图标
        */
       icon: string
       /**
        * 工具描述
        */
       desc: string
       /**
        * 工具分类
        */
       category: string
}

export const categories = [
       { id: 'all', name: '全部工具' },
       { id: 'dev', name: '开发工具' },
       { id: 'network', name: '网络工具' },
       { id: 'crypto', name: '加密解密' },
       { id: 'convert', name: '格式转换' }
];