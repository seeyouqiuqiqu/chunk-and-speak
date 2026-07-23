const STREAM_ERROR_MARK = '[STREAM_ERROR]'

function getApiBase() {
  const configured = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  return configured || ''
}

/**
 * 流式解析英文文本。
 * @param {string} text
 * @param {{
 *   signal?: AbortSignal,
 *   onChunk?: (chunk: string) => void,
 *   onMode?: (mode: string) => void
 * }} options
 */
export async function parseTextStream(text, { signal, onChunk, onMode } = {}) {
  const base = getApiBase()
  let response

  try {
    response = await fetch(`${base}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    const error = new Error('网络连接失败，请稍后重试')
    error.code = 'NETWORK'
    throw error
  }

  if (!response.ok) {
    let message = '解析服务暂时不可用，请检查服务配置'
    try {
      const data = await response.json()
      if (data?.error) message = data.error
    } catch {
      // ignore
    }

    const error = new Error(message)
    error.status = response.status
    if (response.status === 429) error.code = 'RATE_LIMIT'
    if (response.status === 504) error.code = 'TIMEOUT'
    throw error
  }

  const headerMode = response.headers.get('X-Parse-Mode')
  if (headerMode) onMode?.(headerMode)

  if (!response.body) {
    throw new Error('解析服务暂时不可用，请检查服务配置')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    if (!chunk) continue

    // 流中错误标记：不写入正文
    if (chunk.includes(STREAM_ERROR_MARK) || full.includes(STREAM_ERROR_MARK)) {
      const combined = full + chunk
      const idx = combined.indexOf(STREAM_ERROR_MARK)
      const safe = combined.slice(0, idx)
      const errMsg =
        combined.slice(idx + STREAM_ERROR_MARK.length).trim() ||
        '解析过程中发生错误，请重试。'
      if (safe.length > full.length) {
        onChunk?.(safe.slice(full.length))
      }
      const error = new Error(errMsg)
      error.code = 'STREAM_ERROR'
      error.partial = safe
      throw error
    }

    full += chunk
    onChunk?.(chunk)
  }

  return full
}
