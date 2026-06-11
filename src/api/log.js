import request from '@/utils/request'

export function getLogList(params) {
  return request({ url: '/api/log/list', method: 'get', params })
}

export function getLogActions() {
  return request({ url: '/api/log/actions', method: 'get' })
}
