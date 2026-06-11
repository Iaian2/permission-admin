import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { queryOne, queryAll, run } from '../db.js'
import { signToken, authMiddleware } from '../middleware/auth.js'

const router = Router()

// 登录（无需认证）
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.json({ code: 400, message: '用户名和密码不能为空' })
  }

  const user = queryOne('SELECT * FROM users WHERE username = ?', [username.trim()])
  if (!user) return res.json({ code: 400, message: '用户名或密码错误' })

  if (!bcrypt.compareSync(password, user.password)) {
    return res.json({ code: 400, message: '用户名或密码错误' })
  }

  if (user.status === 0) {
    return res.json({ code: 400, message: '账号已被禁用' })
  }

  const token = signToken({ id: user.id, username: user.username })

  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '登录', ?, '登录成功', ?)`,
    [user.id, user.username, user.username, req.ip || '']
  )

  const { password: _, ...safe } = user
  res.json({ code: 200, data: { ...safe, token }, message: '登录成功' })
})

// 获取当前用户信息（含角色和权限）
router.get('/auth/info', authMiddleware, (req, res) => {
  const user = queryOne(
    'SELECT id, username, nickname, email, avatar, status, created_at FROM users WHERE id = ?',
    [req.user.id]
  )
  if (!user) return res.json({ code: 404, message: '用户不存在' })

  const roles = queryAll(
    `SELECT r.id, r.name, r.code FROM roles r
     JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = ?`, [user.id]
  )

  const perms = queryAll(
    `SELECT DISTINCT p.code FROM permissions p
     JOIN role_permissions rp ON p.id = rp.permission_id
     JOIN user_roles ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = ?`, [user.id]
  )

  const menuTree = queryAll(
    `SELECT DISTINCT p.* FROM permissions p
     JOIN role_permissions rp ON p.id = rp.permission_id
     JOIN user_roles ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = ? AND p.type = 'menu'
     ORDER BY p.sort_order`, [user.id]
  )

  res.json({
    code: 200,
    data: {
      ...user,
      roles: roles.map(r => r.code),
      roleNames: roles.map(r => r.name),
      permissions: perms.map(p => p.code),
      menus: menuTree
    }
  })
})

// 登出
router.post('/auth/logout', authMiddleware, (req, res) => {
  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, '登出', ?, '登出成功', ?)`,
    [req.user.id, req.user.username, req.user.username, req.ip || '']
  )
  res.json({ code: 200, message: '登出成功' })
})

export default router
