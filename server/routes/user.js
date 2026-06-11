import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { queryAll, queryOne, run, lastID } from '../db.js'
import { authMiddleware, requirePermission } from '../middleware/auth.js'

const router = Router()

// 所有用户管理路由都需要登录
router.use(authMiddleware)

// 获取用户列表（分页 + 搜索）
router.get('/list', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 10
  const keyword = req.query.keyword || ''
  const offset = (page - 1) * pageSize

  let whereSql = 'WHERE 1=1'
  const params = []

  if (keyword) {
    whereSql += ' AND (username LIKE ? OR nickname LIKE ? OR email LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }

  const countRow = queryOne(`SELECT COUNT(*) as total FROM users ${whereSql}`, params)
  const total = countRow.total

  const users = queryAll(
    `SELECT id, username, nickname, email, avatar, status, created_at FROM users ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )

  for (const user of users) {
    const roles = queryAll(
      `SELECT r.id, r.name, r.code FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`,
      [user.id]
    )
    user.roles = roles
  }

  res.json({
    code: 200,
    data: { list: users, total, page, pageSize }
  })
})

// 获取单个用户
router.get('/:id', (req, res) => {
  const user = queryOne(
    'SELECT id, username, nickname, email, avatar, status, created_at FROM users WHERE id = ?',
    [req.params.id]
  )
  if (!user) return res.json({ code: 404, message: '用户不存在' })

  const roles = queryAll(
    `SELECT r.id, r.name, r.code FROM roles r
     JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`,
    [user.id]
  )
  user.roles = roles
  res.json({ code: 200, data: user })
})

// 新增用户
router.post('/add', requirePermission('user:add'), (req, res) => {
  const { username, password, nickname, email, roleIds } = req.body

  if (!username?.trim()) return res.json({ code: 400, message: '用户名不能为空' })
  if (!password?.trim()) return res.json({ code: 400, message: '密码不能为空' })
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json({ code: 400, message: '邮箱格式不正确' })

  const exist = queryOne('SELECT id FROM users WHERE username = ?', [username.trim()])
  if (exist) return res.json({ code: 400, message: '用户名已存在' })

  const hash = bcrypt.hashSync(password.trim(), 10)
  run(
    `INSERT INTO users (username, password, nickname, email) VALUES (?, ?, ?, ?)`,
    [username.trim(), hash, nickname?.trim() || username.trim(), email?.trim() || '']
  )
  const id = lastID()

  if (roleIds && roleIds.length > 0) {
    for (const rid of roleIds) {
      run('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [id, rid])
    }
  }

  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '新增用户', ?, ?, ?)`,
    [req.user.id, req.user.username, username.trim(), `新增用户 ${username.trim()}`, req.ip || '']
  )

  const user = queryOne('SELECT id, username, nickname, email, status, created_at FROM users WHERE id = ?', [id])
  res.json({ code: 200, data: user, message: '新增成功' })
})

// 编辑用户
router.put('/:id', requirePermission('user:edit'), (req, res) => {
  const { username, password, nickname, email, roleIds } = req.body
  const uid = req.params.id

  const user = queryOne('SELECT * FROM users WHERE id = ?', [uid])
  if (!user) return res.json({ code: 404, message: '用户不存在' })

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json({ code: 400, message: '邮箱格式不正确' })

  if (username?.trim() && username.trim() !== user.username) {
    const exist = queryOne('SELECT id FROM users WHERE username = ? AND id != ?', [username.trim(), uid])
    if (exist) return res.json({ code: 400, message: '用户名已存在' })
  }

  const newUsername = username?.trim() || user.username
  const newNickname = nickname?.trim() || user.nickname
  const newEmail = email?.trim() ?? user.email

  if (password?.trim()) {
    const hash = bcrypt.hashSync(password.trim(), 10)
    run('UPDATE users SET username=?, password=?, nickname=?, email=?, updated_at=datetime(\'now\',\'localtime\') WHERE id=?',
      [newUsername, hash, newNickname, newEmail, uid])
  } else {
    run('UPDATE users SET username=?, nickname=?, email=?, updated_at=datetime(\'now\',\'localtime\') WHERE id=?',
      [newUsername, newNickname, newEmail, uid])
  }

  if (roleIds !== undefined) {
    run('DELETE FROM user_roles WHERE user_id = ?', [uid])
    if (roleIds.length > 0) {
      for (const rid of roleIds) {
        run('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [uid, rid])
      }
    }
  }

  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '编辑用户', ?, ?, ?)`,
    [req.user.id, req.user.username, newUsername, `编辑用户 ${newUsername}`, req.ip || '']
  )

  const updated = queryOne('SELECT id, username, nickname, email, status, created_at FROM users WHERE id = ?', [uid])
  res.json({ code: 200, data: updated, message: '更新成功' })
})

// 删除用户
router.delete('/:id', requirePermission('user:delete'), (req, res) => {
  const uid = req.params.id
  if (uid == 1) return res.json({ code: 400, message: '不能删除超级管理员' })

  const user = queryOne('SELECT username FROM users WHERE id = ?', [uid])
  if (!user) return res.json({ code: 404, message: '用户不存在' })

  run('DELETE FROM user_roles WHERE user_id = ?', [uid])
  run('DELETE FROM users WHERE id = ?', [uid])

  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '删除用户', ?, ?, ?)`,
    [req.user.id, req.user.username, user.username, `删除用户 ${user.username}`, req.ip || '']
  )

  res.json({ code: 200, message: '删除成功' })
})

// 批量删除
router.post('/batch-delete', requirePermission('user:delete'), (req, res) => {
  const { ids } = req.body
  if (!ids || !ids.length) return res.json({ code: 400, message: '请选择要删除的用户' })
  if (ids.includes(1)) return res.json({ code: 400, message: '不能删除超级管理员' })

  const placeholders = ids.map(() => '?').join(',')
  run(`DELETE FROM user_roles WHERE user_id IN (${placeholders})`, ids)
  run(`DELETE FROM users WHERE id IN (${placeholders})`, ids)

  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '批量删除用户', ?, ?, ?)`,
    [req.user.id, req.user.username, ids.join(','), `批量删除 ${ids.length} 个用户`, req.ip || '']
  )

  res.json({ code: 200, message: `成功删除 ${ids.length} 个用户` })
})

export default router
