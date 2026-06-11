import { getToken } from '@/utils/auth.js'
import { ElMessage } from 'element-plus'

// 导出 Excel（通过 <a> 下载，token 放在 query 参数中）
export function exportUsers() {
  const token = getToken()
  if (!token) {
    ElMessage.error('请先登录')
    return
  }
  const a = document.createElement('a')
  a.href = `/api/export/users?token=${encodeURIComponent(token)}`
  a.download = ''
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  ElMessage.success('导出任务已开始')
}
