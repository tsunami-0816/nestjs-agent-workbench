import axios from 'axios'
import { authStore, clearAuth } from '../stores/auth'
import { ElMessage } from 'element-plus'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

api.interceptors.request.use((config) => {
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body.code === 0) return body.data
    ElMessage.error(body.message || '请求失败')
    return Promise.reject(new Error(body.message))
  },
  (err) => {
    if (err.response?.status === 401) {
      clearAuth()
      location.href = '/login'
    }
    ElMessage.error(err.response?.data?.message || err.message)
    return Promise.reject(err)
  },
)

export default api
