import axios from 'axios'
import { getToken, removeToken } from './auth.js'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '',
  timeout: 15000
})

// 请求拦截器：自动带 token
request.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    // 业务级错误提示（非 200）
    if (res.code !== 200) {
      ElMessage.error(res.message || '操作失败')
    }
    return res
  },
  error => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        removeToken()
        ElMessage.error('登录已过期，请重新登录')
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
      } else if (status === 403) {
        ElMessage.error('没有操作权限')
      } else {
        ElMessage.error(data?.message || `请求失败 (${status})`)
      }
      return Promise.reject(new Error(data?.message || `请求失败`))
    }
    ElMessage.error('网络连接失败，请检查后端服务')
    return Promise.reject(new Error('网络连接失败'))
  }
)

export default request
