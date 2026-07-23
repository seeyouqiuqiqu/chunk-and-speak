import { Router } from 'express'
import { getPromptsForText } from '../prompts.js'
import { countEnglishWords, detectParseMode } from '../wordUtils.js'

const router = Router()

const MAX_CHARS = 10000

function getUpstreamErrorStatus(status) {
  if (status === 429) return 429
  if (status === 401 || status === 403) return 502
  if (status >= 500) return 502
  return 502
}

router.post('/', async (req, res) => {
  const { text } = req.body ?? {}

  if (typeof text !== 'string') {
    return res.status(400).json({ error: '请输入需要解析的英文内容' })
  }

  const trimmed = text.trim()
  if (!trimmed) {
    return res.status(400).json({ error: '请输入需要解析的英文内容' })
  }

  if (trimmed.length > MAX_CHARS) {
    return res.status(400).json({ error: `文本过长，请控制在 ${MAX_CHARS} 个字符以内` })
  }

  const wordCount = countEnglishWords(trimmed)
  if (wordCount < 1) {
    return res.status(400).json({ error: '请输入有效的英文单词、短语或句子' })
  }

  const mode = detectParseMode(trimmed)
  const { systemPrompt, userPrompt } = getPromptsForText(trimmed)

  const baseURL = process.env.AI_BASE_URL?.replace(/\/$/, '')
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL
  const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS) || 15000

  if (!baseURL || !apiKey || !model) {
    return res.status(500).json({ error: '解析服务暂时不可用，请检查服务配置' })
  }

  const upstreamController = new AbortController()
  let firstByteTimer = setTimeout(() => {
    upstreamController.abort('first_byte_timeout')
  }, timeoutMs)

  // 前端断开时立刻中止上游请求。
  // 注意：必须监听 res 而非 req——req 在请求体读取完毕后就会触发 close，
  // 会导致每个请求都被误判为“客户端已断开”。
  const onClientClose = () => {
    if (res.writableEnded) return
    clearTimeout(firstByteTimer)
    upstreamController.abort('client_closed')
  }
  res.on('close', onClientClose)

  try {
    const upstream = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: upstreamController.signal,
    })

    if (!upstream.ok) {
      clearTimeout(firstByteTimer)
      res.off('close', onClientClose)
      const status = getUpstreamErrorStatus(upstream.status)
      if (upstream.status === 429) {
        return res.status(429).json({ error: '当前请求较多，请稍后再试' })
      }
      return res.status(status).json({ error: '解析服务暂时不可用，请检查服务配置' })
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.setHeader('X-Parse-Mode', mode)
    res.setHeader('Access-Control-Expose-Headers', 'X-Parse-Mode')
    res.flushHeaders?.()

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let sentFirstByte = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      if (!sentFirstByte) {
        sentFirstByte = true
        clearTimeout(firstByteTimer)
        firstByteTimer = null
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine.startsWith('data:')) continue
        const data = trimmedLine.slice(5).trim()
        if (!data || data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            res.write(content)
          }
        } catch {
          // 忽略无法解析的 SSE 行
        }
      }
    }

    res.end()
  } catch (err) {
    clearTimeout(firstByteTimer)

    const aborted = err?.name === 'AbortError' || upstreamController.signal.aborted
    if (aborted) {
      const reason = upstreamController.signal.reason
      if (reason === 'client_closed' || req.aborted) {
        // 客户端已断开，无需再写响应
        return
      }
      if (!res.headersSent) {
        return res.status(504).json({ error: '解析超时，请检查网络或重试' })
      }
      try {
        res.write('\n\n[STREAM_ERROR]解析超时，请检查网络或重试')
        res.end()
      } catch {
        // ignore
      }
      return
    }

    console.error('[parse] upstream error:', err?.message || err)
    if (!res.headersSent) {
      return res.status(500).json({ error: '解析服务暂时不可用，请检查服务配置' })
    }
    try {
      res.write('\n\n[STREAM_ERROR]解析过程中发生错误，请重试。')
      res.end()
    } catch {
      // ignore
    }
  } finally {
    clearTimeout(firstByteTimer)
    res.off('close', onClientClose)
  }
})

export default router
