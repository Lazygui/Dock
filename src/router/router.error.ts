import toast from '@/general/toast';
import { mitter } from "@/hooks/mitter";
const ERROR_TOAST = () => {
       toast.error('请检查路由配置是否正确')
}

mitter.on('ROUTE:ERROR_PUSH_NULL', ERROR_TOAST)