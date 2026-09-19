import { motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";

const htmlLines = [
  [
    { t: "<", c: "#569CD6" },
    { t: "!DOCTYPE", c: "#569CD6" },
    { t: " html", c: "#9CDCFE" },
    { t: ">", c: "#D4D4D4" },
  ],
  [
    { t: "<", c: "#569CD6" },
    { t: "html", c: "#569CD6" },
    { t: " lang", c: "#9CDCFE" },
    { t: "=", c: "#D4D4D4" },
    { t: '"pt"', c: "#CE9178" },
    { t: ">", c: "#D4D4D4" },
  ],
  [{ t: "  <body>", c: "#569CD6" }],
  [
    { t: "    ", c: "" },
    { t: "<!-- minha primeira página -->", c: "#6A9955", i: true },
  ],
  [
    { t: "    <", c: "#569CD6" },
    { t: "main", c: "#569CD6" },
    { t: " class", c: "#9CDCFE" },
    { t: "=", c: "#D4D4D4" },
    { t: '"card"', c: "#CE9178" },
    { t: ">", c: "#D4D4D4" },
  ],
  [
    { t: "      <", c: "#569CD6" },
    { t: "h1", c: "#569CD6" },
    { t: ">Olá, mundo!</", c: "#D4D4D4" },
    { t: "h1", c: "#569CD6" },
    { t: ">", c: "#D4D4D4" },
  ],
  [
    { t: "      <", c: "#569CD6" },
    { t: "p", c: "#569CD6" },
    { t: ">Feita na WebStart.</", c: "#D4D4D4" },
    { t: "p", c: "#569CD6" },
    { t: ">", c: "#D4D4D4" },
  ],
  [
    { t: "      <", c: "#569CD6" },
    { t: "button", c: "#569CD6" },
    { t: " class", c: "#9CDCFE" },
    { t: "=", c: "#D4D4D4" },
    { t: '"btn"', c: "#CE9178" },
    { t: ">", c: "#D4D4D4" },
    { t: "Clique aqui</", c: "#D4D4D4" },
    { t: "button", c: "#569CD6" },
    { t: ">", c: "#D4D4D4" },
  ],
  [
    { t: "    </", c: "#569CD6" },
    { t: "main", c: "#569CD6" },
    { t: ">", c: "#D4D4D4" },
  ],
  [{ t: "  </body>", c: "#569CD6" }],
  [{ t: "</html>", c: "#569CD6" }],
];

export function CodeWindow() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="overflow-hidden rounded-xl border border-[#3c3c3c] bg-[#1e1e1e] font-mono shadow-brutal-lg"
      role="img"
      aria-label="Editor de código da plataforma com HTML e preview ao vivo"
    >
      <div className="flex items-center gap-2 border-b border-[#3c3c3c] bg-[#2d2d30] px-3 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
        </div>
        <span className="ml-2 text-[11px] text-[#808080]">
          Laboratório WebStart
        </span>
      </div>

      <div className="flex border-b border-[#3c3c3c] bg-[#252526] text-[11px]">
        <span className="border-b-2 border-[#0E639C] px-4 py-2 text-[#D4D4D4]">
          <span className="mr-1.5 font-bold text-[#E34C26]">&lt;&gt;</span>
          index.html
        </span>
        <span className="px-4 py-2 text-[#808080]">
          <span className="mr-1.5 font-bold text-[#1572B6]">#</span>style.css
        </span>
      </div>

      <div className="grid md:grid-cols-2">
        <pre className="overflow-x-auto py-3 text-[12px] leading-[1.7] text-[#D4D4D4] md:border-r md:border-[#3c3c3c]">
          <code>
            {htmlLines.map((line, i) => (
              <div key={i} className="flex">
                <span className="w-10 shrink-0 select-none pr-3 text-right text-[#858585]">
                  {i + 1}
                </span>
                <span>
                  {line.map((seg, j) => (
                    <span
                      key={j}
                      style={{
                        color: seg.c,
                        fontStyle: seg.i ? "italic" : "normal",
                      }}
                    >
                      {seg.t}
                    </span>
                  ))}
                  {i === htmlLines.length - 1 && (
                    <span className="animate-caret ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] bg-[#AEAFAD]" />
                  )}
                </span>
              </div>
            ))}
          </code>
        </pre>

        <div className="hidden flex-col bg-canvas md:flex" aria-hidden="true">
          <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-1.5">
            <Lock size={10} className="text-muted" />
            <span className="rounded border border-border bg-elevated px-2 py-0.5 text-[10px] text-secondary">
              localhost:5173
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-950 to-canvas p-6">
            <div className="w-full max-w-[220px] rounded-xl border-2 border-brand-500 bg-surface p-4 text-center shadow-md">
              <p className="font-sans text-lg font-black text-primary">
                Olá, mundo!
              </p>
              <p className="mt-1 font-sans text-xs text-secondary">
                Feita na WebStart.
              </p>
              <span className="mt-3 inline-block rounded-lg bg-brand-500 px-4 py-1.5 font-sans text-xs font-bold text-white">
                Clique aqui
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#3c3c3c] bg-[#1e1e1e] px-4 py-2">
        <p className="text-[11px] text-[#4EC9B0]">
          <span className="text-[#808080]">console</span> · preview atualizado
          ao vivo
        </p>
      </div>
    </motion.div>
  );
}
