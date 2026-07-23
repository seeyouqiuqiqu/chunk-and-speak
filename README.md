# Chunk & Speak

英语语块拆解与口语转化器。输入一段英文，应用会调用大模型进行语块拆解，并将偏书面表达转化为地道口语，结果以流式 Markdown 实时展示。

支持两种解析模式（自动判断）：

- **词汇精讲**：输入 1～2 个英文单词（如 `actually`、`work out`）
- **语块拆解**：输入 3 个及以上单词的句子或段落

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18、Vite、Tailwind CSS、react-markdown、react-hot-toast、lucide-react |
| 后端 | Node.js、Express、OpenAI 兼容 Chat Completions API（流式） |

## 环境要求

- Node.js 18+
- npm 9+

## 安装

```bash
git clone <repo-url>
cd lexical_chunk_tool
npm run install:all
```

## 环境变量

### 后端 `server/.env`

```bash
cp server/.env.example server/.env
```

```env
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_api_key_here
AI_MODEL=gpt-4.1-mini
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
REQUEST_TIMEOUT_MS=15000
```

**智谱 AI 示例：**

```env
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_API_KEY=你的智谱Key
AI_MODEL=glm-4-flash
```

### 前端 `client/.env`

开发环境使用 Vite 代理时，可留空 `VITE_API_BASE_URL`；生产环境指向独立后端：

```env
VITE_API_BASE_URL=http://localhost:3001
```

> **安全提示：** 所有 `VITE_` 变量会暴露给浏览器，**禁止**在前端配置 API Key。密钥只能写在 `server/.env`。

## 本地开发

```bash
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001

## 生产构建

```bash
npm run build    # 构建前端静态资源到 client/dist
npm run start    # 启动后端（需自行托管 client/dist 或使用 CDN）
```

## API 说明

### `POST /api/parse`

**请求：**

```json
{ "text": "The English text entered by the user." }
```

**成功：** `Content-Type: text/plain; charset=utf-8` 流式返回 Markdown 文本。

**错误（流式开始前）：**

```json
{ "error": "错误信息" }
```

| 状态码 | 含义 |
|--------|------|
| 400 | 输入不合法 |
| 429 | 上游限流 |
| 502 | 上游 AI 异常 |
| 504 | 首包超时 |
| 500 | 服务器错误 |

## 更换 OpenAI 兼容服务

只需修改 `server/.env`：

```env
AI_BASE_URL=https://your-provider.com/v1
AI_API_KEY=your_key
AI_MODEL=your-model-name
```

无需改动前端代码。

## 常见错误排查

| 现象 | 处理 |
|------|------|
| 启动报错「缺少必要环境变量」 | 检查 `server/.env` 是否配置 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` |
| 解析超时 | 检查网络；免费模型可能较慢，可换更快模型 |
| 429 限流 | 稍后再试或升级 API 套餐 |
| 前端无法请求后端 | 确认后端已启动；开发环境依赖 Vite 代理 `/api` |
| CORS 错误 | 确认 `CLIENT_ORIGIN` 与前端地址一致 |

## 安全说明

- API Key **仅**保存在后端 `server/.env`
- `.env` 已加入 `.gitignore`，切勿提交
- 前端通过后端代理调用大模型，不直接暴露密钥
- AI 返回的 Markdown 经 `rehype-sanitize` 过滤，不使用 `dangerouslySetInnerHTML`

## 项目结构

```text
chunk-and-speak/
├─ client/          # React 前端
├─ server/          # Express 后端
├─ package.json     # 根脚本（install:all / dev / build / start）
└─ README.md
```

## Roadmap

- [ ] 解析结果持久化到数据库（历史记录、收藏语块）
- [ ] 用户体系与多设备同步
- [ ] 语块复习模式（间隔重复）

## License

MIT © [seeyouqiuqiqu](https://github.com/seeyouqiuqiqu)
