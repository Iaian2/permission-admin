import request from '@/utils/request'

export function getPermissionTree() {
  return request({ url: '/api/permission/tree', method: 'get' })
}

export function getAllPermissions() {
  return request({ url: '/api/permission/all', method: 'get' })
}

export function getRolePermissionIds(roleId) {
  return request({ url: `/api/permission/role/${roleId}`, method: 'get' })
}

export function addPermission(data) {
  return request({ url: '/api/permission/add', method: 'post', data })
}
