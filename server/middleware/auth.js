import jwt from 'jsonwebtoken'
import { queryOne, run } from '../db.js'

const JWT_SECRET = 'permission-admin-secret-key-2024'
const JWT_EXPIRES = '7d'

// 签发 token
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

// 验证 token 中间件
export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' })
  }

  const token = auth.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (e) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' })
  }
}

// 权限检查中间件工厂
export function requirePermission(...codes) {
  return (req, res, next) => {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ code: 401, message: '未登录' })

    // admin 角色(id=1)跳过检查
    const adminRole = queryOne(
      `SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = 1`, [userId]
    )
    if (adminRole) return next()

    // 检查是否有任一所需权限
    const placeholders = codes.map(() => '?').join(',')
    const row = queryOne(`
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ? AND p.code IN (${placeholders})
    `, [userId, ...codes])

    if (!row) {
      return res.status(403).json({ code: 403, message: '没有操作权限' })
    }
    next()
  }
}

// 记录操作日志
export function logAction(userId, username, action, target = '', detail = '', ip = '') {
  run(
    `INSERT INTO operation_logs (user_id, username, action, target, detail, ip) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId || null, username || 'anonymous', action, target, detail, ip || '']
  )
}

export { JWT_SECRET }
