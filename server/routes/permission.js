import { Router } from 'express'
import { queryAll, queryOne, run, lastID } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// 获取权限树
router.get('/tree', (_req, res) => {
  const all = queryAll('SELECT * FROM permissions ORDER BY sort_order')
  const tree = buildTree(all, 0)
  res.json({ code: 200, data: tree })
})

// 获取所有权限（平铺 + 分组）
router.get('/all', (_req, res) => {
  const all = queryAll('SELECT * FROM permissions ORDER BY type, sort_order')
  const menus = all.filter(p => p.type === 'menu')
  const buttons = all.filter(p => p.type === 'button')
  res.json({ code: 200, data: { all, menus, buttons } })
})

// 获取角色已分配的权限 ID 列表
router.get('/role/:roleId', (req, res) => {
  const rows = queryAll(
    'SELECT permission_id FROM role_permissions WHERE role_id = ?',
    [req.params.roleId]
  )
  res.json({ code: 200, data: rows.map(r => r.permission_id) })
})

// 新增权限节点
router.post('/add', (req, res) => {
  const { name, code, type, parent_id, path, icon, sort_order } = req.body
  if (!name?.trim()) return res.json({ code: 400, message: '权限名称不能为空' })
  if (!code?.trim()) return res.json({ code: 400, message: '权限编码不能为空' })

  const exist = queryOne('SELECT id FROM permissions WHERE code = ?', [code.trim()])
  if (exist) return res.json({ code: 400, message: '权限编码已存在' })

  run(
    `INSERT INTO permissions (name, code, type, parent_id, path, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name.trim(), code.trim(), type || 'button', parent_id || 0, path || '', icon || '', sort_order || 0]
  )
  const id = lastID()

  run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, ?)', [id])

  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '新增权限', ?, ?, ?)`,
    [req.user.id, req.user.username, name.trim(), `新增权限 ${name.trim()}`, req.ip || '']
  )

  const perm = queryOne('SELECT * FROM permissions WHERE id = ?', [id])
  res.json({ code: 200, data: perm, message: '新增成功' })
})

function buildTree(list, parentId) {
  return list
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildTree(list, item.id)
    }))
}

export default router
