const TOKEN_KEY = 'permission_admin_token'
const USER_KEY = 'permission_admin_user'

// 获取 token
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

// 设置 token（remember: true → localStorage, false → sessionStorage）
export function setToken(token, remember = false) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
  }
}

// 移除 token
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(USER_KEY)
}

// 缓存用户信息
export function setUser(user) {
  const key = getToken() === localStorage.getItem(TOKEN_KEY) ? USER_KEY : USER_KEY
  if (localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

// 获取缓存的用户信息
export function getUser() {
  const data = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
  if (!data) return null
  try { return JSON.parse(data) } catch { return null }
}

// 是否已登录
export function isLoggedIn() {
  return !!getToken()
}
