import { useCallback, useEffect, useRef, useState, memo } from 'react'
import { highlightCode } from './SyntaxHighlighter.js'

const KEYWORDS_CLOSE = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
}

const AUTO_CLOSE_TAGS = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'button', 'li', 'ul', 'ol', 'section', 'article',
  'header', 'footer', 'nav', 'main', 'aside', 'form',
  'label', 'textarea', 'select', 'option', 'table', 'tr', 'td', 'th',
  'thead', 'tbody', 'tfoot', 'dl', 'dt', 'dd', 'figure', 'figcaption',
  'details', 'summary', 'dialog', 'fieldset', 'legend',
]

function EditorGutter({ lineCount, activeLine }) {
  return (
    <div className="lab-gutter" aria-hidden="true">
      {Array.from({ length: lineCount }, (_, i) => (
        <div
          key={i}
          className={`lab-gutter-line ${i + 1 === activeLine ? 'lab-gutter-active' : ''}`}
        >
          {i + 1}
        </div>
      ))}
    </div>
  )
}

const EditorGutterMemo = memo(EditorGutter)

export function CodeEditor({
  value,
  onChange,
  language = 'html',
  placeholder = '',
  readOnly = false,
}) {
  const editorRef = useRef(null)
  const textareaRef = useRef(null)
  const highlightRef = useRef(null)
  const [activeLine, setActiveLine] = useState(1)
  const [scrollTop, setScrollTop] = useState(0)

  const safeValue = value ?? ''
  const lineCount = safeValue.split('\n').length
  const highlighted = highlightCode(safeValue, language)

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current
    const hl = highlightRef.current
    if (ta && hl) {
      hl.scrollTop = ta.scrollTop
      hl.scrollLeft = ta.scrollLeft
      setScrollTop(ta.scrollTop)
    }
  }, [])

  useEffect(() => {
    syncScroll()
  }, [value, syncScroll])

  const handleChange = useCallback((e) => {
    onChange(e.target.value)
  }, [onChange])

  const handleKeyDown = useCallback((e) => {
    const ta = textareaRef.current
    if (!ta) return

    // Tab = 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
      return
    }

    // Auto-close brackets and quotes
    if (KEYWORDS_CLOSE[e.key]) {
      e.preventDefault()
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const closeChar = KEYWORDS_CLOSE[e.key]
      const newVal = value.substring(0, start) + e.key + closeChar + value.substring(end)
      onChange(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 1
      })
      return
    }

    // Auto-close HTML tags
    if (e.key === '>') {
      const start = ta.selectionStart
      const before = value.substring(0, start)
      const openTagMatch = before.match(/<(\w+)$/)
      if (openTagMatch) {
        const tagName = openTagMatch[1]
        if (AUTO_CLOSE_TAGS.includes(tagName)) {
          e.preventDefault()
          const newVal = value.substring(0, start) + '></' + tagName + '>' + value.substring(start)
          onChange(newVal)
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + 1
          })
          return
        }
      }
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const start = ta.selectionStart
      const before = value.substring(0, start)
      const indentMatch = before.match(/(\n|^)([ \t]*)/)
      const currentIndent = indentMatch ? indentMatch[2] || '' : ''
      let extraIndent = ''

      // Increase indent after {
      if (before.trimEnd().endsWith('{')) {
        extraIndent = '  '
      }
      // Increase indent after <tag>
      const lastOpen = before.lastIndexOf('<')
      const lastClose = before.lastIndexOf('>')
      if (lastOpen > lastClose) {
        const tagContent = before.substring(lastOpen + 1)
        if (tagContent && !tagContent.startsWith('/') && !tagContent.includes('/')) {
          // Only for non-self-closing tags
          if (!['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagContent.split(/[\s>]/)[0])) {
            extraIndent = '  '
          }
        }
      }

      if (extraIndent) {
        e.preventDefault()
        const newVal = value.substring(0, start) + '\n' + currentIndent + extraIndent + '\n' + currentIndent + value.substring(start)
        onChange(newVal)
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 1 + currentIndent.length + extraIndent.length
        })
        return
      }
    }

    // Backspace - remove matching closing bracket/quote
    if (e.key === 'Backspace') {
      const start = ta.selectionStart
      if (start < value.length) {
        const charBefore = value[start - 1]
        const charAfter = value[start]
        if (KEYWORDS_CLOSE[charBefore] === charAfter) {
          e.preventDefault()
          const newVal = value.substring(0, start - 1) + value.substring(start + 1)
          onChange(newVal)
          return
        }
        // Remove closing tag pair
        const beforeText = value.substring(0, start)
        const closeTagMatch = beforeText.match(/<(\w+)>([^<]*)$/)
        if (closeTagMatch) {
          const tagName = closeTagMatch[1]
          const afterText = value.substring(start)
          if (afterText.startsWith('</' + tagName + '>')) {
            e.preventDefault()
            const tagLen = closeTagMatch[0].length
            const closeLen = '</' + tagName + '>'.length
            const newVal = value.substring(0, start - tagLen) + value.substring(start + closeLen)
            onChange(newVal)
            return
          }
        }
      }
    }

    // Handle closing bracket auto-skip
    if (e.key === ')' || e.key === ']' || e.key === '}' || e.key === '"' || e.key === "'" || e.key === '`') {
      const start = ta.selectionStart
      if (value[start] === e.key) {
        e.preventDefault()
        ta.selectionStart = ta.selectionEnd = start + 1
        return
      }
    }
  }, [value, onChange])

  const handleSelect = useCallback(() => {
    const ta = textareaRef.current
    if (ta) {
      const text = value.substring(0, ta.selectionStart)
      setActiveLine((text.match(/\n/g) || []).length + 1)
    }
  }, [value])

  // Close brackets when pasting
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return

    const handlePaste = () => {
      // Let the paste happen naturally
      requestAnimationFrame(() => {
        syncScroll()
      })
    }

    ta.addEventListener('paste', handlePaste)
    return () => ta.removeEventListener('paste', handlePaste)
  }, [syncScroll])

  return (
    <div className="lab-editor-wrapper">
      <div className="lab-editor-header">
        <span className="lab-editor-lang">{language.toUpperCase()}</span>
        <span className="lab-editor-info">Linha {activeLine}, Coluna 1</span>
      </div>
      <div className="lab-editor-body" ref={editorRef}>
        <EditorGutterMemo lineCount={Math.max(lineCount, 1)} activeLine={activeLine} />
        <div className="lab-editor-content">
          <div className="lab-editor-highlight" ref={highlightRef}>
            <pre className="lab-editor-pre">
              <code
                className={`language-${language}`}
                dangerouslySetInnerHTML={{
                  __html: highlighted || ' ',
                }}
              />
            </pre>
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            onSelect={handleSelect}
            onClick={handleSelect}
            className="lab-editor-textarea"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            wrap="off"
            readOnly={readOnly}
            placeholder={placeholder}
            aria-label={`Editor de ${language}`}
          />
          {!value && (
            <div className="lab-editor-placeholder">{placeholder}</div>
          )}
        </div>
      </div>
    </div>
  )
}
