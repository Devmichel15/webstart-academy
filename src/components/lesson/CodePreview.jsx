import { useMemo } from 'react'

export function CodePreview({ html = '', css = '', title = 'Preview' }) {
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
    <div className="overflow-hidden rounded-xl border-3 border-brand-800 dark:border-brand-400">
      <div className="border-b-2 border-brand-800 bg-brand-100 px-4 py-2 text-sm font-bold dark:border-brand-400 dark:bg-brand-900">
        {title}
      </div>
      <iframe
        title={title}
        srcDoc={srcDoc}
        sandbox="allow-same-origin"
        className="h-64 w-full bg-white"
      />
    </div>
  )
}
