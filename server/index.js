import express from 'express'
import cors from 'cors'
import { initDB } from './db.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import roleRoutes from './routes/role.js'
import permissionRoutes from './routes/permission.js'
import logRoutes from './routes/log.js'
import exportRoutes from './routes/export.js'

const app = express()

app.use(cors())
app.use(express.json())

// 健康检查（无需认证，放在最前面）
app.get('/api/health', (_req, res) => {
  res.json({ code: 200, message: 'ok', time: new Date().toISOString() })
})

// 按前缀挂载路由（每个路由文件内部自行处理认证）
app.use('/api', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/role', roleRoutes)
app.use('/api/permission', permissionRoutes)
app.use('/api/log', logRoutes)
app.use('/api/export', exportRoutes)

const PORT = 8080

async function start() {
  await initDB()
  console.log('✅ 数据库已初始化')
  app.listen(PORT, () => {
    console.log(`✅ 后端服务已启动: http://localhost:${PORT}`)
    console.log(`📋 API 健康检查: http://localhost:${PORT}/api/health`)
    console.log(`🔐 默认账号: admin / admin123`)
  })
}

start().catch(err => {
  console.error('启动失败:', err)
  process.exit(1)
})
