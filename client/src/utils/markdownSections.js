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

/** 解析第 4 模块的两个版本（语块模式） */
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

/**
 * 从一段文本中提取首个看起来像英文句子/短语的内容（用于复制）。
 */
export function extractFirstEnglishLine(text) {
  if (!text) return ''
  const lines = text
    .split('\n')
    .map((l) => l.replace(/^[-*•\d.)\]]+\s*/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)

  for (const line of lines) {
    // 跳过明显中文主导的行
    const latin = (line.match(/[A-Za-z]/g) || []).length
    const cjk = (line.match(/[\u4e00-\u9fff]/g) || []).length
    if (latin >= 2 && latin > cjk) {
      // 去掉「例句：」等前缀
      return line.replace(/^(例句|英文|搭配|句型)[：:]\s*/i, '').trim()
    }
  }
  return ''
}

/** 将列表型模块拆成独立条目（搭配 / 口语例句） */
export function splitListItems(body) {
  if (!body?.trim()) return []

  const parts = body
    .split(/\n(?=(?:\d+[\.、．)]\s+|[-*•]\s+))/g)
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length <= 1) {
    // 尝试按空行分段
    const blocks = body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
    return blocks.length > 1 ? blocks : [body.trim()]
  }

  return parts
}

/** 解析词汇模式第 6 模块中的推荐句型 */
export function parseRecommendedPattern(body) {
  const patternMatch = body.match(
    /\*\*推荐句型：\*\*\s*\n+([\s\S]*?)(?=\n\s*\*\*使用示例：\*\*|$)/i
  )
  const exampleMatch = body.match(
    /\*\*使用示例：\*\*\s*\n+([\s\S]*?)$/i
  )

  let tips = body
  if (patternMatch) {
    tips = body.slice(0, body.search(/\*\*推荐句型：\*\*/i)).trim()
  }

  const pattern = patternMatch?.[1]?.trim() || ''
  const exampleBlock = exampleMatch?.[1]?.trim() || ''
  const exampleLines = exampleBlock
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  let exampleEn = ''
  let exampleZh = ''
  for (const line of exampleLines) {
    const latin = (line.match(/[A-Za-z]/g) || []).length
    const cjk = (line.match(/[\u4e00-\u9fff]/g) || []).length
    if (!exampleEn && latin > cjk) exampleEn = line
    else if (exampleEn && !exampleZh && cjk > 0) exampleZh = line
  }

  return { tips, pattern, exampleEn, exampleZh }
}
