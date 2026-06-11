import { Router } from 'express'
import { queryAll, queryOne } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// 操作日志列表（分页 + 搜索）
router.get('/list', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 15
  const keyword = req.query.keyword || ''
  const action = req.query.action || ''
  const startDate = req.query.startDate || ''
  const endDate = req.query.endDate || ''
  const offset = (page - 1) * pageSize

  let whereSql = 'WHERE 1=1'
  const params = []

  if (keyword) {
    whereSql += ' AND (username LIKE ? OR target LIKE ? OR detail LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }
  if (action) {
    whereSql += ' AND action = ?'
    params.push(action)
  }
  if (startDate) {
    whereSql += ' AND created_at >= ?'
    params.push(startDate)
  }
  if (endDate) {
    whereSql += ' AND created_at <= ?'
    params.push(endDate + ' 23:59:59')
  }

  const countRow = queryOne(`SELECT COUNT(*) as total FROM operation_logs ${whereSql}`, params)
  const total = countRow.total

  const list = queryAll(
    `SELECT * FROM operation_logs ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )

  res.json({ code: 200, data: { list, total, page, pageSize } })
})

// 操作类型列表
router.get('/actions', (_req, res) => {
  const rows = queryAll('SELECT DISTINCT action FROM operation_logs ORDER BY action')
  res.json({ code: 200, data: rows.map(r => r.action) })
})

export default router
