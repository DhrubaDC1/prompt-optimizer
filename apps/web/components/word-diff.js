// Each token is a word plus the whitespace after it, so joining tokens rebuilds the text.
function tokenize(text) {
  return text.match(/\S+\s*|\s+/g) ?? []
}

const key = (token) => token.trimEnd()

// Word-level diff of `before` → `after` as [{ type: 'same' | 'add' | 'del', text }].
export function diffWords(before, after) {
  const a = tokenize(before)
  const b = tokenize(after)

  let start = 0
  while (start < a.length && start < b.length && key(a[start]) === key(b[start])) start += 1

  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && key(a[endA - 1]) === key(b[endB - 1])) {
    endA -= 1
    endB -= 1
  }

  // shortcut: O(n*m) LCS table; prompts are capped near 8k chars, so this stays a few MB.
  const n = endA - start
  const m = endB - start
  const width = m + 1
  const table = new Uint16Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i * width + j] =
        key(a[start + i]) === key(b[start + j])
          ? table[(i + 1) * width + j + 1] + 1
          : Math.max(table[(i + 1) * width + j], table[i * width + j + 1])
    }
  }

  const parts = []
  const push = (type, text) => {
    const last = parts.at(-1)
    if (last?.type === type) last.text += text
    else parts.push({ type, text })
  }

  for (let k = 0; k < start; k += 1) push('same', b[k])

  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (key(a[start + i]) === key(b[start + j])) {
      push('same', b[start + j])
      i += 1
      j += 1
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
      push('del', a[start + i])
      i += 1
    } else {
      push('add', b[start + j])
      j += 1
    }
  }
  for (; i < n; i += 1) push('del', a[start + i])
  for (; j < m; j += 1) push('add', b[start + j])

  for (let k = endB; k < b.length; k += 1) push('same', b[k])

  return parts
}
