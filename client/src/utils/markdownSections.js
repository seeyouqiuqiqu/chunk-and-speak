/** 将 Markdown 按 ## 模块标题切分 */
export function splitMainSections(markdown) {
  if (!markdown?.trim()) return []

  const parts = markdown.split(/(?=^##\s+\d+\.)/m).filter(Boolean)
  return parts.map((part) => {
    const match = part.match(/^##\s+(\d+)\.\s*(.+?)\s*\n([\s\S]*)$/)
    if (!match) {
      return { index: 0, title: '', body: part.trim(), raw: part.trim() }
    }
    return {
      index: Number(match[1]),
      title: match[2].trim(),
      body: match[3].trim(),
      raw: part.trim(),
    }
  })
}

/** 从口语版本块中提取英文改写（用于复制） */
export function extractEnglishRewrite(body) {
  const match = body.match(
    /\*\*英文改写：\*\*\s*\n+([\s\S]*?)(?=\n\s*\*\*中文直译|\n\s*###|\n\s*##|$)/i
  )
  if (match) return match[1].trim()
  // 兜底：取第一个非空段落
  const para = body.split('\n\n').find((p) => /[a-zA-Z]/.test(p))
  return para?.replace(/^[-*]\s*/, '').trim() || body.trim()
}

/** 解析第 4 模块的两个版本 */
export function parseOralVersions(body) {
  const v1Match = body.match(
    /###\s*版本一[：:][^\n]*\n([\s\S]*?)(?=###\s*版本二[：:]|$)/i
  )
  const v2Match = body.match(/###\s*版本二[：:][^\n]*\n([\s\S]*)/i)

  return {
    intro: body.split(/###\s*版本一[：:]/i)[0]?.trim() || '',
    version1: v1Match ? v1Match[1].trim() : '',
    version2: v2Match ? v2Match[1].trim() : '',
  }
}
