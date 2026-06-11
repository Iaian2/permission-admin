import request from '@/utils/request'

export function getUserList(params) {
  return request({ url: '/api/user/list', method: 'get', params })
}

export function getUserById(id) {
  return request({ url: `/api/user/${id}`, method: 'get' })
}

export function addUser(data) {
  return request({ url: '/api/user/add', method: 'post', data })
}

export function updateUser(id, data) {
  return request({ url: `/api/user/${id}`, method: 'put', data })
}

export function deleteUser(id) {
  return request({ url: `/api/user/${id}`, method: 'delete' })
}

export function batchDeleteUsers(ids) {
  return request({ url: '/api/user/batch-delete', method: 'post', data: { ids } })
}
