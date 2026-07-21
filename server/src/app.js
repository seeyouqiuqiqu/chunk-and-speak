import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import parseRouter from './routes/parse.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const required = ['AI_BASE_URL', 'AI_API_KEY', 'AI_MODEL']
const missing = required.filter((key) => !process.env[key]?.trim())
if (missing.length) {
  console.error(`缺少必要环境变量: ${missing.join(', ')}`)
  console.error('请复制 server/.env.example 为 server/.env 并填写配置后重试。')
  process.exit(1)
}

const app = express()
const PORT = Number(process.env.PORT) || 3001
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
  })
)

app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/parse', parseRouter)

app.use((err, _req, res, _next) => {
  console.error('[server]', err?.message || err)
  if (!res.headersSent) {
    res.status(500).json({ error: '解析服务暂时不可用，请检查服务配置' })
  }
})

app.listen(PORT, () => {
  console.log(`Chunk & Speak API 运行在 http://localhost:${PORT}`)
})
