import { Router } from 'express'
import { queryAll, queryOne, run, lastID } from '../db.js'
import { authMiddleware, requirePermission } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// 获取所有角色
router.get('/all', (_req, res) => {
  const roles = queryAll('SELECT * FROM roles ORDER BY id')
  res.json({ code: 200, data: roles })
})

// 获取角色列表（含权限数统计）
router.get('/list', (_req, res) => {
  const roles = queryAll('SELECT * FROM roles ORDER BY id')
  for (const role of roles) {
    const count = queryOne('SELECT COUNT(*) as c FROM role_permissions WHERE role_id = ?', [role.id])
    role.permCount = count.c
  }
  res.json({ code: 200, data: roles })
})

// 新增角色
router.post('/add', requirePermission('role:add'), (req, res) => {
  const { name, code, description } = req.body
  if (!name?.trim()) return res.json({ code: 400, message: '角色名称不能为空' })
  if (!code?.trim()) return res.json({ code: 400, message: '角色编码不能为空' })

  const exist = queryOne('SELECT id FROM roles WHERE code = ?', [code.trim()])
  if (exist) return res.json({ code: 400, message: '角色编码已存在' })

  run('INSERT INTO roles (name, code, description) VALUES (?, ?, ?)',
    [name.trim(), code.trim(), description?.trim() || ''])
  const id = lastID()

  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '新增角色', ?, ?, ?)`,
    [req.user.id, req.user.username, name.trim(), `新增角色 ${name.trim()}`, req.ip || '']
  )

  const role = queryOne('SELECT * FROM roles WHERE id = ?', [id])
  res.json({ code: 200, data: role, message: '新增成功' })
})

// 编辑角色
router.put('/:id', requirePermission('role:edit'), (req, res) => {
  const { name, code, description } = req.body
  const rid = req.params.id
  if (rid == 1) return res.json({ code: 400, message: '不能修改管理员角色' })

  const role = queryOne('SELECT * FROM roles WHERE id = ?', [rid])
  if (!role) return res.json({ code: 404, message: '角色不存在' })

  if (code?.trim() && code.trim() !== role.code) {
    const exist = queryOne('SELECT id FROM roles WHERE code = ? AND id != ?', [code.trim(), rid])
    if (exist) return res.json({ code: 400, message: '角色编码已存在' })
  }

  run('UPDATE roles SET name=?, code=?, description=? WHERE id=?',
    [name?.trim() || role.name, code?.trim() || role.code, description?.trim() ?? role.description, rid])

  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '编辑角色', ?, ?, ?)`,
    [req.user.id, req.user.username, name?.trim() || role.name, `编辑角色`, req.ip || '']
  )

  const updated = queryOne('SELECT * FROM roles WHERE id = ?', [rid])
  res.json({ code: 200, data: updated, message: '更新成功' })
})

// 删除角色
router.delete('/:id', requirePermission('role:delete'), (req, res) => {
  const rid = req.params.id
  if (rid <= 3) return res.json({ code: 400, message: '不能删除系统内置角色' })

  const role = queryOne('SELECT name FROM roles WHERE id = ?', [rid])
  if (!role) return res.json({ code: 404, message: '角色不存在' })

  run('DELETE FROM role_permissions WHERE role_id = ?', [rid])
  run('DELETE FROM user_roles WHERE role_id = ?', [rid])
  run('DELETE FROM roles WHERE id = ?', [rid])

  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '删除角色', ?, ?, ?)`,
    [req.user.id, req.user.username, role.name, `删除角色 ${role.name}`, req.ip || '']
  )

  res.json({ code: 200, message: '删除成功' })
})

// 保存角色权限
router.put('/:id/permissions', requirePermission('role:perm'), (req, res) => {
  const rid = req.params.id
  if (rid == 1) return res.json({ code: 400, message: '管理员角色拥有所有权限，不需要分配' })

  const role = queryOne('SELECT * FROM roles WHERE id = ?', [rid])
  if (!role) return res.json({ code: 404, message: '角色不存在' })

  const { permissionIds } = req.body
  run('DELETE FROM role_permissions WHERE role_id = ?', [rid])
  if (permissionIds && permissionIds.length > 0) {
    for (const pid of permissionIds) {
      run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [rid, pid])
    }
  }

  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '分配权限', ?, ?, ?)`,
    [req.user.id, req.user.username, role.name, `为角色 ${role.name} 分配权限`, req.ip || '']
  )

  res.json({ code: 200, message: '权限分配成功' })
})

export default router
