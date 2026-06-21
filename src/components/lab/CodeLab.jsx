import { useMemo, useState } from 'react'
import { Copy, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'

export function CodeLab({
  initialHtml = '<h1>WebStart Lab</h1>\n<p>Edite aqui!</p>',
  initialCss = 'body { font-family: sans-serif; padding: 1rem; }\nh1 { color: #059669; }',
  compact = false,
}) {
  const [html, setHtml] = useState(initialHtml)
  const [css, setCss] = useState(initialCss)

  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  ${css}
</style>
</head>
<body>
${html}
</body>
</html>`
  }, [html, css])

  const handleReset = () => {
    setHtml(initialHtml)
    setCss(initialCss)
  }

  const handleCopy = async () => {
    const code = `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`
    await navigator.clipboard.writeText(code)
  }

  return (
    <div className={`grid gap-4 ${compact ? 'lg:grid-cols-2' : 'lg:grid-cols-2'}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold">Editor</h4>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw size={14} />
              Reset
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              <Copy size={14} />
              Copiar
            </Button>
          </div>
        </div>
        <label className="block text-xs font-bold uppercase tracking-wide">HTML</label>
        <textarea
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          className="h-40 w-full resize-y rounded-lg border-3 border-brand-800 bg-white p-3 font-mono text-sm dark:border-brand-400 dark:bg-brand-950 dark:text-brand-100"
          spellCheck={false}
        />
        <label className="block text-xs font-bold uppercase tracking-wide">CSS</label>
        <textarea
          value={css}
          onChange={(event) => setCss(event.target.value)}
          className="h-32 w-full resize-y rounded-lg border-3 border-brand-800 bg-white p-3 font-mono text-sm dark:border-brand-400 dark:bg-brand-950 dark:text-brand-100"
          spellCheck={false}
        />
      </div>

      <div>
        <h4 className="mb-3 font-bold">Preview em tempo real</h4>
        <div className="overflow-hidden rounded-xl border-3 border-brand-800 dark:border-brand-400">
          <iframe
            title="Lab Preview"
            srcDoc={srcDoc}
            sandbox="allow-same-origin"
            className={`w-full bg-white ${compact ? 'h-[22rem]' : 'h-[28rem]'}`}
          />
        </div>
      </div>
    </div>
  )
}
