import request from '@/utils/request'

export function getRoleList() {
  return request({ url: '/api/role/list', method: 'get' })
}

export function getAllRoles() {
  return request({ url: '/api/role/all', method: 'get' })
}

export function addRole(data) {
  return request({ url: '/api/role/add', method: 'post', data })
}

export function updateRole(id, data) {
  return request({ url: `/api/role/${id}`, method: 'put', data })
}

export function deleteRole(id) {
  return request({ url: `/api/role/${id}`, method: 'delete' })
}

export function saveRolePermissions(roleId, permissionIds) {
  return request({ url: `/api/role/${roleId}/permissions`, method: 'put', data: { permissionIds } })
}
