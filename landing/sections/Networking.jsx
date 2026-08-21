import { motion, useReducedMotion } from 'framer-motion'
import { Reveal, SectionHeader } from '../components/Reveal'

const nodes = [
  { label: 'Colega de trilha', x: 70, y: 52 },
  { label: 'Parceiro de projeto', x: 330, y: 48 },
  { label: 'Amigo dev', x: 96, y: 208 },
  { label: 'Quem você vai inspirar', x: 316, y: 204 },
]

export function Networking() {
  const reduced = useReducedMotion()
  const cx = 200
  const cy = 128

  return (
    <section className="relative py-20 sm:py-28" aria-labelledby="networking-title">
      <div className="wrap grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="relative order-2 mx-auto w-full max-w-lg lg:order-1" aria-hidden="true">
          <svg viewBox="0 0 400 256" className="w-full" role="presentation">
            <motion.circle
              cx={cx}
              cy={cy}
              r="34"
              fill="#10b981"
              stroke="#022c22"
              strokeWidth="3"
              initial={reduced ? false : { scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            />
            <text x={cx} y={cy - 4} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
              Você
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#ecfdf5" fontSize="9" fontWeight="600">
              WebStart
            </text>

            {nodes.map((node, i) => {
              const dx = node.x + 32 - cx
              const dy = node.y + 26 - cy
              const len = Math.sqrt(dx * dx + dy * dy)
              const ux = dx / len
              const uy = dy / len
              const x1 = cx + ux * 38
              const y1 = cy + uy * 38
              const x2 = node.x + 32 - ux * 30
              const y2 = node.y + 26 - uy * 30
              return (
                <g key={node.label}>
                  <motion.line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#34d399"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                    initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 0.6 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.45 + i * 0.18 }}
                  />
                  <circle cx={node.x + 32} cy={node.y + 26} r="24" fill="#1e1e24" stroke="#3c3c44" strokeWidth="2" />
                  <text x={node.x + 32} y={node.y + 30} textAnchor="middle" fill="#a0a0b0" fontSize="12" fontWeight="700">
                    {'</>'}
                  </text>
                </g>
              )
            })}
          </svg>

          {nodes.map((node, i) => (
            <span
              key={node.label}
              className={`absolute rounded-md border border-border bg-elevated px-2 py-1 font-mono text-[10px] font-bold text-secondary ${i % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}
              style={{
                left: `${(node.x / 400) * 100}%`,
                top: `calc(${(node.y / 256) * 100}% + ${i % 2 === 0 ? '-22px' : '56px'})`,
              }}
            >
              {node.label}
            </span>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <SectionHeader
            align="left"
            eyebrow="networking que acontece de verdade"
            title={
              <>
                Conheça quem está <span className="text-accent">construindo com você.</span>
              </>
            }
            id="networking-title"
          >
            <p>
              A pessoa que começou na mesma trilha pode virar parceira do seu próximo projeto. Quem tira sua dúvida num
              comentário pode virar amigo. E os amigos que você faz programando podem construir coisas grandes com você.
            </p>
            <p className="mt-4 font-bold text-primary">
              A WebStart começa com programação — mas cria conexões através dela.
            </p>
          </SectionHeader>

          <Reveal delay={0.25} className="mt-8 grid gap-3 sm:grid-cols-2">
            {['Um colega para estudar junto', 'Um parceiro para o projeto final', 'Alguém da área que você admira', 'Uma amizade que ultrapassa o código'].map(
              (item) => (
                <div key={item} className="rounded-xl border-2 border-border bg-surface px-4 py-3 text-sm font-semibold text-secondary">
                  {item}
                </div>
              ),
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
