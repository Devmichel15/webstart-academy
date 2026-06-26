const VSCODE_COLORS = {
  tag: '#569CD6',
  attrName: '#9CDCFE',
  attrValue: '#CE9178',
  string: '#CE9178',
  comment: '#6A9955',
  keyword: '#569CD6',
  number: '#B5CEA8',
  selector: '#D7BA7D',
  property: '#9CDCFE',
  value: '#CE9178',
  punctuation: '#D4D4D4',
  plain: '#D4D4D4',
  cssClass: '#D7BA7D',
  cssId: '#F44747',
  cssPseudo: '#C586C0',
  cssTag: '#569CD6',
  jsKeyword: '#569CD6',
  jsString: '#CE9178',
  jsNumber: '#B5CEA8',
  jsFunction: '#DCDCAA',
  jsComment: '#6A9955',
}

function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightHtml(code) {
  if (typeof code !== 'string') return ''
  const lines = code.split('\n')
  return lines.map((line) => {
    let result = ''
    let i = 0
    while (i < line.length) {
      // Comment
      if (line.slice(i).match(/^<!--[\s\S]*?-->/)) {
        const m = line.slice(i).match(/^<!--[\s\S]*?-->/)
        result += `<span class="syn-comment">${escapeHtml(m[0])}</span>`
        i += m[0].length
        continue
      }
      // Tag
      if (line[i] === '<') {
        const tagMatch = line.slice(i).match(/^<\/?([\w-]+)/)
        if (tagMatch) {
          result += `<span class="syn-punct">&lt;</span>`
          if (tagMatch[0].startsWith('</')) {
            result += `<span class="syn-punct">/</span>`
          }
          result += `<span class="syn-tag">${escapeHtml(tagMatch[1])}</span>`
          i += tagMatch[0].length
          // Attributes
          while (i < line.length && line[i] !== '>' && line[i] !== '/') {
            if (line[i] === ' ') {
              result += ' '
              i++
              continue
            }
            const attrMatch = line.slice(i).match(/^([\w-]+)(=)?/)
            if (attrMatch) {
              result += `<span class="syn-attr">${escapeHtml(attrMatch[1])}</span>`
              i += attrMatch[1].length
              if (attrMatch[2]) {
                result += `<span class="syn-punct">=</span>`
                i++
                const quoteMatch = line.slice(i).match(/^"([^"]*?)"/)
                if (quoteMatch) {
                  result += `<span class="syn-punct">"</span><span class="syn-string">${escapeHtml(quoteMatch[1])}</span><span class="syn-punct">"</span>`
                  i += quoteMatch[0].length
                }
              }
            } else {
              result += escapeHtml(line[i])
              i++
            }
          }
          if (i < line.length && line[i] === '/') {
            result += `<span class="syn-punct">/</span>`
            i++
          }
          if (i < line.length && line[i] === '>') {
            result += `<span class="syn-punct">&gt;</span>`
            i++
          }
          continue
        }
        // DOCTYPE
        const doctypeMatch = line.slice(i).match(/^<(!DOCTYPE[\s\S]*?)>/i)
        if (doctypeMatch) {
          result += `<span class="syn-tag">&lt;${escapeHtml(doctypeMatch[1])}&gt;</span>`
          i += doctypeMatch[0].length
          continue
        }
      }
      // Plain text
      result += escapeHtml(line[i])
      i++
    }
    return result
  }).join('\n')
}

function highlightCss(code) {
  if (typeof code !== 'string') return ''
  const lines = code.split('\n')
  return lines.map((line) => {
    let result = ''
    let i = 0
    while (i < line.length) {
      // Comment
      if (line.slice(i).startsWith('/*')) {
        const end = line.indexOf('*/', i + 2)
        const comment = end === -1 ? line.slice(i) : line.slice(i, end + 2)
        result += `<span class="syn-comment">${escapeHtml(comment)}</span>`
        i += comment.length
        continue
      }
      // String values
      const strMatch = line.slice(i).match(/^"([^"]*?)"/)
      if (strMatch) {
        result += `<span class="syn-string">${escapeHtml(strMatch[0])}</span>`
        i += strMatch[0].length
        continue
      }
      // Numbers
      if (line.slice(i).match(/^\d+(\.\d+)?(px|em|rem|%|vh|vw|s|ms|deg|fr)?/)) {
        const m = line.slice(i).match(/^\d+(\.\d+)?(px|em|rem|%|vh|vw|s|ms|deg|fr)?/)
        result += `<span class="syn-number">${escapeHtml(m[0])}</span>`
        i += m[0].length
        continue
      }
      // Pseudo classes/selectors
      if (line[i] === ':') {
        const pseudo = line.slice(i).match(/^:[\w-]+/)
        if (pseudo) {
          result += `<span class="syn-pseudo">${escapeHtml(pseudo[0])}</span>`
          i += pseudo[0].length
          continue
        }
      }
      // ID selectors
      if (line[i] === '#') {
        const idMatch = line.slice(i).match(/^#[\w-]+/)
        if (idMatch) {
          result += `<span class="syn-css-id">${escapeHtml(idMatch[0])}</span>`
          i += idMatch[0].length
          continue
        }
      }
      // Class selectors
      if (line[i] === '.') {
        const classMatch = line.slice(i).match(/^\.[\w-]+/)
        if (classMatch) {
          result += `<span class="syn-css-class">${escapeHtml(classMatch[0])}</span>`
          i += classMatch[0].length
          continue
        }
      }
      // Tag selectors (word at start or after comma/space)
      const tagSel = line.slice(i).match(/^([\w-]+)\s*(?=[,{.#\s])/)
      if (tagSel && (i === 0 || line[i - 1] === ',' || line[i - 1] === ' ' || line[i - 1] === '\n')) {
        // Check if we're in a selector context (before `{`)
        const beforeBrace = line.indexOf('{') === -1 ? line.length : line.indexOf('{')
        if (i < beforeBrace) {
          const cssKeywords = ['margin', 'padding', 'color', 'background', 'display', 'position', 'width', 'height', 'font', 'border', 'gap', 'grid', 'flex', 'align', 'justify', 'text', 'overflow', 'opacity', 'transform', 'transition', 'animation', 'box', 'z-index', 'top', 'left', 'right', 'bottom']
          if (!cssKeywords.includes(tagSel[1])) {
            result += `<span class="syn-css-tag">${escapeHtml(tagSel[1])}</span>`
            i += tagSel[1].length
            continue
          }
        }
      }
      // Properties (word followed by colon)
      const propMatch = line.slice(i).match(/^([\w-]+)\s*(?=:)/)
      if (propMatch) {
        result += `<span class="syn-property">${escapeHtml(propMatch[1])}</span>`
        i += propMatch[1].length
        continue
      }
      // Values after colon
      if (line[i] === ':') {
        result += `<span class="syn-punct">:</span>`
        i++
        // Check for value keywords after colon
        const valMatch = line.slice(i).match(/^\s*(solid|dashed|dotted|none|block|inline|flex|grid|relative|absolute|fixed|center|left|right|top|bottom|cover|contain|auto|inherit|initial|hidden|visible|nowrap|wrap|column|row|space-between|space-around|space-evenly|start|end|baseline|stretch|normal|bold|italic|underline|uppercase|lowercase|capitalize|pointer|default|none)\b/)
        if (valMatch) {
          result += `<span class="syn-value">${escapeHtml(valMatch[0])}</span>`
          i += valMatch[0].length
          continue
        }
      }
      // Punct
      if ('{}[],;'.includes(line[i])) {
        result += `<span class="syn-punct">${escapeHtml(line[i])}</span>`
        i++
        continue
      }
      // Keywords (@media, @keyframes, etc)
      if (line[i] === '@') {
        const atMatch = line.slice(i).match(/^@[\w-]+/)
        if (atMatch) {
          result += `<span class="syn-keyword">${escapeHtml(atMatch[0])}</span>`
          i += atMatch[0].length
          continue
        }
      }
      // Units after numbers
      result += escapeHtml(line[i])
      i++
    }
    return result
  }).join('\n')
}

export function highlightCode(code, language) {
  if (typeof code !== 'string') return ''
  if (language === 'css') return highlightCss(code)
  return highlightHtml(code)
}
