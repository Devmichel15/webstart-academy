import { useMemo } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

export function PreviewFrame({ html, css, expanded, onToggleExpand }) {
  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; margin: 0; padding: 1rem; }
  ${css}
</style>
</head>
<body>
${html}
</body>
</html>`
  }, [html, css])

  return (
    <div className={`lab-preview ${expanded ? 'lab-preview-expanded' : ''}`}>
      {/* Browser Chrome */}
      <div className="lab-preview-chrome">
        <div className="lab-preview-dots">
          <span className="lab-dot lab-dot-red" />
          <span className="lab-dot lab-dot-yellow" />
          <span className="lab-dot lab-dot-green" />
        </div>
        <div className="lab-preview-address">
          <span className="lab-preview-lock">🔒</span>
          webstart.dev/lab
        </div>
        <button
          className="lab-preview-expand-btn"
          onClick={onToggleExpand}
          title={expanded ? 'Reduzir preview' : 'Expandir preview'}
        >
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Iframe */}
      <div className="lab-preview-viewport">
        <iframe
          title="Preview do Laboratório"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin"
          className="lab-preview-iframe"
        />
      </div>
    </div>
  )
}
