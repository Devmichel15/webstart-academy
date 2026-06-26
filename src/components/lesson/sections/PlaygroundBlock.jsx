import { useMemo, useState } from 'react'
import { Copy, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../../ui/Button'

export function PlaygroundBlock({ html = '', css = '', compact = false }) {
  const [codeHtml, setCodeHtml] = useState(html)
  const [codeCss, setCodeCss] = useState(css)

  const srcDoc = useMemo(() => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;margin:0;padding:1rem}${codeCss}</style>
</head>
<body>${codeHtml}</body>
</html>`, [codeHtml, codeCss])

  const handleReset = () => {
    setCodeHtml(html)
    setCodeCss(css)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`<!-- HTML -->\n${codeHtml}\n\n/* CSS */\n${codeCss}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-xl border-3 border-brand-800 bg-white p-5 dark:border-brand-400 dark:bg-brand-950"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-black">Playground</h3>
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
      <div className={`grid gap-4 ${compact ? 'lg:grid-cols-2' : 'lg:grid-cols-2'}`}>
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide">HTML</label>
          <textarea
            value={codeHtml}
            onChange={(e) => setCodeHtml(e.target.value)}
            className="h-32 w-full resize-y rounded-lg border-3 border-brand-800 bg-white p-3 font-mono text-sm dark:border-brand-400 dark:bg-brand-950 dark:text-brand-100"
            spellCheck={false}
          />
          <label className="block text-xs font-bold uppercase tracking-wide">CSS</label>
          <textarea
            value={codeCss}
            onChange={(e) => setCodeCss(e.target.value)}
            className="h-24 w-full resize-y rounded-lg border-3 border-brand-800 bg-white p-3 font-mono text-sm dark:border-brand-400 dark:bg-brand-950 dark:text-brand-100"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="mb-3 block text-xs font-bold uppercase tracking-wide">Preview</label>
          <div className="overflow-hidden rounded-xl border-3 border-brand-800 dark:border-brand-400">
            <iframe
              title="Playground Preview"
              srcDoc={srcDoc}
              sandbox="allow-same-origin"
              className="h-64 w-full bg-white"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
