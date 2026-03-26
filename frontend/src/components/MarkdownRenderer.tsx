/**
 * Lightweight markdown renderer for prompt content.
 * Keeps the implementation dependency-free and safe for user content.
 */
interface MarkdownRendererProps {
  content: string
  className?: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeUrl(value: string) {
  const trimmed = value.trim()
  if (/^(https?:\/\/|mailto:|\/)/i.test(trimmed)) {
    return escapeHtml(trimmed)
  }
  return '#'
}

function formatInline(text: string) {
  const codeSegments: string[] = []
  let output = escapeHtml(text)

  output = output.replace(/`([^`]+)`/g, (_, code: string) => {
    const token = `__CODE_${codeSegments.length}__`
    codeSegments.push(`<code>${escapeHtml(code)}</code>`)
    return token
  })

  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) => {
    return `<a href="${sanitizeUrl(url)}" target="_blank" rel="noreferrer">${label}</a>`
  })

  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  output = output.replace(/\*(?!\s)([^*\n]+)\*/g, '<em>$1</em>')

  codeSegments.forEach((segment, index) => {
    output = output.replace(`__CODE_${index}__`, segment)
  })

  return output
}

function renderMarkdown(content: string) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []

  let index = 0
  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) {
        index += 1
      }
      blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      continue
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      blocks.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`)
      index += 1
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push('<hr />')
      index += 1
      continue
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = []
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push(`<blockquote>${quoteLines.map((item) => formatInline(item)).join('<br />')}</blockquote>`)
      continue
    }

    if (/^(\d+\.\s|[-*]\s)/.test(line)) {
      const isOrdered = /^\d+\.\s/.test(line)
      const tagName = isOrdered ? 'ol' : 'ul'
      const listItems: string[] = []

      while (index < lines.length && /^(\d+\.\s|[-*]\s)/.test(lines[index])) {
        const itemText = lines[index].replace(/^(\d+\.\s|[-*]\s)/, '')
        listItems.push(`<li>${formatInline(itemText)}</li>`)
        index += 1
      }

      blocks.push(`<${tagName}>${listItems.join('')}</${tagName}>`)
      continue
    }

    const paragraphLines: string[] = [line]
    index += 1
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^```/.test(lines[index]) &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^(\d+\.\s|[-*]\s)/.test(lines[index]) &&
      !/^>\s?/.test(lines[index]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index])
      index += 1
    }

    blocks.push(`<p>${formatInline(paragraphLines.join(' '))}</p>`)
  }

  return blocks.join('')
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div
      className={`markdown-renderer ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}
