import initSqlJs from 'sql.js'
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data', 'permission.db')

let db

// --- 初始化 ---
export async function initDB() {
  const SQL = await initSqlJs()

  // 尝试从文件加载
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      email TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'menu',
      parent_id INTEGER DEFAULT 0,
      path TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, role_id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT DEFAULT '',
      action TEXT NOT NULL,
      target TEXT DEFAULT '',
      detail TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  // 预置数据（仅首次）
  const count = db.exec('SELECT COUNT(*) as c FROM users')[0]?.values[0][0]
  if (count === 0) {
    seedData()
  }

  return db
}

function seedData() {
  // 管理员用户 admin/admin123
  const hash = bcrypt.hashSync('admin123', 10)
  db.run(`INSERT INTO users (username, password, nickname, email) VALUES ('admin', ?, '管理员', 'admin@example.com')`, [hash])

  // 3 个角色
  db.run(`INSERT INTO roles (name, code, description) VALUES ('管理员', 'admin', '拥有所有权限')`)
  db.run(`INSERT INTO roles (name, code, description) VALUES ('编辑员', 'editor', '可管理用户和角色')`)
  db.run(`INSERT INTO roles (name, code, description) VALUES ('只读用户', 'viewer', '仅可查看数据')`)

  // 权限项（菜单/按钮/API）
  const perms = [
    // 菜单
    { name: '用户管理', code: 'user:menu', type: 'menu', parent_id: 0, path: '/user', icon: 'User', sort_order: 1 },
    { name: '角色管理', code: 'role:menu', type: 'menu', parent_id: 0, path: '/role', icon: 'Setting', sort_order: 2 },
    { name: '权限查看', code: 'perm:menu', type: 'menu', parent_id: 0, path: '/permission', icon: 'Key', sort_order: 3 },
    { name: '操作日志', code: 'log:menu', type: 'menu', parent_id: 0, path: '/log', icon: 'Document', sort_order: 4 },
    // 按钮权限
    { name: '新增用户', code: 'user:add', type: 'button', parent_id: 1, path: '', icon: '', sort_order: 0 },
    { name: '编辑用户', code: 'user:edit', type: 'button', parent_id: 1, path: '', icon: '', sort_order: 1 },
    { name: '删除用户', code: 'user:delete', type: 'button', parent_id: 1, path: '', icon: '', sort_order: 2 },
    { name: '导出用户', code: 'user:export', type: 'button', parent_id: 1, path: '', icon: '', sort_order: 3 },
    { name: '新增角色', code: 'role:add', type: 'button', parent_id: 2, path: '', icon: '', sort_order: 0 },
    { name: '编辑角色', code: 'role:edit', type: 'button', parent_id: 2, path: '', icon: '', sort_order: 1 },
    { name: '删除角色', code: 'role:delete', type: 'button', parent_id: 2, path: '', icon: '', sort_order: 2 },
    { name: '分配权限', code: 'role:perm', type: 'button', parent_id: 2, path: '', icon: '', sort_order: 3 },
  ]

  const insertPerm = db.prepare(`INSERT INTO permissions (name, code, type, parent_id, path, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  for (const p of perms) {
    insertPerm.run([p.name, p.code, p.type, p.parent_id, p.path, p.icon, p.sort_order])
  }
  insertPerm.free()

  // 给 admin 角色分配所有权限
  const allPerms = db.exec('SELECT id FROM permissions')
  const permIds = allPerms[0]?.values.map(r => r[0]) || []
  const insertRP = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (1, ?)')
  for (const pid of permIds) {
    insertRP.run([pid])
  }
  insertRP.free()

  // 给 editor 角色分配部分权限（用户和角色管理的菜单+按钮）
  const editorPermIds = [1, 2, 5, 6, 7, 8, 9, 10, 11]
  const insertRP2 = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (2, ?)')
  for (const pid of editorPermIds) {
    insertRP2.run([pid])
  }
  insertRP2.free()

  // 给 viewer 角色分配只读权限（仅菜单，无按钮）
  const viewerPermIds = [1, 2, 3, 4]
  const insertRP3 = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (3, ?)')
  for (const pid of viewerPermIds) {
    insertRP3.run([pid])
  }
  insertRP3.free()

  // 给 admin 用户分配管理员角色
  db.run('INSERT INTO user_roles (user_id, role_id) VALUES (1, 1)')

  saveDB()
}

// --- 持久化 ---
export function saveDB() {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

// --- 获取 db 实例 ---
export function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.')
  return db
}

// --- 查询辅助 ---
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows[0] || null
}

export function run(sql, params = []) {
  db.run(sql, params)
  saveDB()
}

export function lastID() {
  const result = db.exec('SELECT last_insert_rowid() as id')
  return result[0]?.values[0][0]
}
