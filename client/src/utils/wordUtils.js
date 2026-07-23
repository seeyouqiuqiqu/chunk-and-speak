/**
 * 前后端共用同一套英文单词计数规则，避免模式判断不一致。
 * 支持：don't / well-known / kind of 等。
 */
export function countEnglishWords(text) {
  if (!text || typeof text !== 'string') return 0
  const matches = text.trim().match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)
  return matches ? matches.length : 0
}

/**
 * @returns {'vocabulary' | 'chunk' | null}
 * null 表示无有效英文单词
 */
export function detectParseMode(text) {
  const count = countEnglishWords(text)
  if (count === 0) return null
  if (count <= 2) return 'vocabulary'
  return 'chunk'
}

export function getModeLabel(mode) {
  if (mode === 'vocabulary') return '词汇精讲模式'
  if (mode === 'chunk') return '语块拆解模式'
  return ''
}

export function getSubmitLabel(mode) {
  if (mode === 'vocabulary') return '深度讲解'
  if (mode === 'chunk') return '一键解析'
  return '一键解析'
}
