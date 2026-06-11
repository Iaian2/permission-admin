import { Router } from 'express'
import ExcelJS from 'exceljs'
import jwt from 'jsonwebtoken'
import { queryAll, queryOne } from '../db.js'
import { JWT_SECRET } from '../middleware/auth.js'

const router = Router()

// 导出用户为 Excel（支持 query token，浏览器 <a> 下载无法设置 Header）
router.get('/users', (req, res) => {
  let token = req.query.token
  if (!token) {
    const auth = req.headers.authorization
    if (auth?.startsWith('Bearer ')) token = auth.slice(7)
  }
  if (!token) return res.status(401).json({ code: 401, message: '未登录' })

  let user
  try { user = jwt.verify(token, JWT_SECRET) }
  catch { return res.status(401).json({ code: 401, message: '登录已过期' }) }

  const perm = queryOne(
    `SELECT 1 FROM user_roles ur
     JOIN role_permissions rp ON ur.role_id = rp.role_id
     JOIN permissions p ON rp.permission_id = p.id
     WHERE ur.user_id = ? AND p.code = 'user:export'`,
    [user.id]
  )
  const isAdmin = queryOne('SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = 1', [user.id])
  if (!perm && !isAdmin) return res.status(403).json({ code: 403, message: '没有导出权限' })

  const users = queryAll(
    `SELECT id, username, nickname, email,
            CASE status WHEN 1 THEN '正常' ELSE '禁用' END as status, created_at
     FROM users ORDER BY id`
  )

  for (const u of users) {
    const roles = queryAll(
      `SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`, [u.id]
    )
    u.roles = roles.map(r => r.name).join('、')
  }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('用户列表')
  sheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: '用户名', key: 'username', width: 16 },
    { header: '昵称', key: 'nickname', width: 16 },
    { header: '邮箱', key: 'email', width: 24 },
    { header: '角色', key: 'roles', width: 20 },
    { header: '状态', key: 'status', width: 8 },
    { header: '创建时间', key: 'created_at', width: 20 }
  ]

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF409EFF' } }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 28

  users.forEach(u => sheet.addRow(u))
  sheet.eachRow((row, rowNumber) => {
    row.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      if (rowNumber > 1) cell.alignment = { vertical: 'middle' }
    })
  })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.xlsx`)
  workbook.xlsx.write(res).then(() => res.end())
})

export default router
