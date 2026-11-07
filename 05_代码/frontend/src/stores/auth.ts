import { reactive } from 'vue'

interface AuthState {
  token: string
  user: { id: number; username: string; role: string } | null
}

export const authStore = reactive<AuthState>({
  token: localStorage.getItem('token') || '',
  user: JSON.parse(localStorage.getItem('user') || 'null'),
})

export function setAuth(token: string, user: any) {
  authStore.token = token
  authStore.user = user
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearAuth() {
  authStore.token = ''
  authStore.user = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
