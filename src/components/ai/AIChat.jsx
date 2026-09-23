import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Loader2, Send, Terminal, User, Code, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react'
import { callAI } from '../../services/aiService'
import { toUserMessage } from '../../utils/errors.js'

const style = {
  container: {
    background: '#0a0a0a',
    border: '2px solid #10b981',
    borderRadius: 12,
    fontFamily: "'Cascadia Code','Fira Code','JetBrains Mono','Consolas',monospace",
    display: 'flex',
    flexDirection: 'column',
    height: 520,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    borderBottom: '2px solid #10b981',
    flexShrink: 0,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    display: 'inline-block',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    scrollBehavior: 'smooth',
  },
  bubbleUser: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px 8px 2px 8px',
    padding: '10px 14px',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  bubbleAI: {
    background: '#0d1f14',
    border: '1px solid rgba(16,185,129,0.25)',
    borderRadius: '8px 8px 8px 2px',
    padding: '10px 14px',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  prompt: {
    color: '#a0a0b0',
    fontSize: 12,
    marginBottom: 4,
  },
  text: {
    color: '#e8e8e8',
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  codeBlock: {
    background: '#111',
    border: '1px solid #10b981',
    borderRadius: 6,
    padding: '10px 12px',
    marginTop: 8,
    fontSize: 12,
    color: '#10b981',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: "'Cascadia Code','Fira Code','JetBrains Mono','Consolas',monospace",
    lineHeight: 1.5,
    overflowX: 'auto',
  },
  scoreBadge: (score) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    border: `1px solid ${score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}`,
    color: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
    marginBottom: 6,
  }),
  errorLine: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    padding: '3px 0',
    fontSize: 12,
    color: '#fca5a5',
  },
  improvementLine: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    padding: '3px 0',
    fontSize: 12,
    color: '#6ee7b7',
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    alignSelf: 'flex-start',
    background: '#0d1f14',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 8,
  },
  inputBar: {
    display: 'flex',
    gap: 8,
    padding: '12px 16px',
    borderTop: '1px solid #222',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: '#111',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#e8e8e8',
    fontSize: 13,
    fontFamily: "'Cascadia Code','Fira Code','JetBrains Mono','Consolas',monospace",
    outline: 'none',
  },
  sendBtn: {
    background: '#10b981',
    border: 'none',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#0a0a0a',
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontFamily: "'Cascadia Code','Fira Code','JetBrains Mono','Consolas',monospace",
  },
  quickBtns: {
    display: 'flex',
    gap: 6,
    padding: '0 16px 8px',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  quickBtn: {
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: 6,
    padding: '4px 10px',
    color: '#a0a0b0',
    fontSize: 11,
    fontFamily: "'Cascadia Code','Fira Code','JetBrains Mono','Consolas',monospace",
    cursor: 'pointer',
  },
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'

  if (isUser) {
    return (
      <div style={style.bubbleUser}>
        <div style={{ ...style.prompt, textAlign: 'right' }}>&gt; {msg.content.slice(0, 60)}{msg.content.length > 60 ? '...' : ''}</div>
        <div style={style.text}>{msg.content}</div>
      </div>
    )
  }

  const { feedback, score, mistakes, improvements, explanation } = msg.data || {}

  return (
    <div style={style.bubbleAI}>
      {typeof score === 'number' && (
        <div style={style.scoreBadge(score)}>
          <CheckCircle size={12} />
          Score: {score}
        </div>
      )}

      {feedback && <div style={{ ...style.text, color: '#ffffff', marginBottom: 8 }}>{feedback}</div>}

      {mistakes && mistakes.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#fca5a5', fontWeight: 700, marginBottom: 4 }}>
            <AlertTriangle size={12} /> Erros
          </div>
          {mistakes.map((m, i) => (
            <div key={i} style={style.errorLine}><span style={{ color: '#ef4444' }}>•</span>{m}</div>
          ))}
        </div>
      )}

      {improvements && improvements.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6ee7b7', fontWeight: 700, marginBottom: 4 }}>
            <Lightbulb size={12} /> Melhorias
          </div>
          {improvements.map((imp, i) => (
            <div key={i} style={style.improvementLine}><span style={{ color: '#10b981' }}>✦</span>{imp}</div>
          ))}
        </div>
      )}

      {explanation && (
        <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(16,185,129,0.06)', borderRadius: 6, fontSize: 12, color: '#a0a0b0', lineHeight: 1.5 }}>
          {explanation}
        </div>
      )}
    </div>
  )
}

function LoadingDots() {
  return (
    <div style={style.indicator}>
      <Loader2 size={14} color="#10b981" className="animate-spin" />
      <span style={{ fontSize: 12, color: '#10b981' }}>IA a pensar...</span>
    </div>
  )
}

export function AIChat({ lessonContext, compact = false }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('question')
  const msgEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollDown = useCallback(() => {
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  useEffect(() => { scrollDown() }, [messages, loading, scrollDown])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const result = await callAI({
        type: mode,
        userAnswer: text,
        lessonContext,
        exercisePrompt: '',
      })
      setMessages((prev) => [...prev, { role: 'ai', content: text, data: result }])
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: text,
        data: {
          feedback: toUserMessage(err, 'Erro ao contactar a IA. Tenta novamente.'),
          score: 0,
          mistakes: [],
          improvements: [],
          explanation: '',
        },
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, mode, lessonContext])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [
    { label: 'O que é HTML?', mode: 'question' },
    { label: 'Corrigir código', mode: 'exercise_check' },
    { label: 'Tag vs Elemento', mode: 'explain' },
  ]

  const chatH = compact ? 400 : 520

  return (
    <div style={{ ...style.container, height: chatH }}>
      <div style={style.header}>
        <span style={{ ...style.headerDot, background: '#10b981' }} />
        <span style={{ color: '#10b981', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>WebStart AI</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {['question', 'exercise_check', 'explain'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                background: mode === m ? '#10b981' : 'transparent',
                border: `1px solid ${mode === m ? '#10b981' : '#333'}`,
                borderRadius: 4,
                padding: '2px 8px',
                color: mode === m ? '#0a0a0a' : '#a0a0b0',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {m === 'question' ? '?' : m === 'exercise_check' ? '</>' : '!'}
            </button>
          ))}
        </span>
      </div>

      <div style={style.messages}>
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
            <Terminal size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              <div style={{ color: '#10b981' }}>$ webstart --ai-tutor</div>
              <div style={{ color: '#555', marginTop: 8 }}>
                {mode === 'question' ? 'Pergunta algo sobre HTML/CSS/JS' :
                 mode === 'exercise_check' ? 'Cola o teu código para análise' :
                 'Pede explicação sobre um conceito'}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MessageBubble msg={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LoadingDots />
          </motion.div>
        )}

        <div ref={msgEndRef} />
      </div>

      {messages.length === 0 && (
        <div style={style.quickBtns}>
          {quickQuestions.map((q) => (
            <button
              key={q.label}
              style={style.quickBtn}
              onClick={() => { setMode(q.mode); setInput(q.label); setTimeout(() => inputRef.current?.focus(), 100) }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#a0a0b0' }}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      <div style={style.inputBar}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'question' ? 'Faz uma pergunta...' :
            mode === 'exercise_check' ? 'Cola o teu código HTML...' :
            'Pede uma explicação...'
          }
          style={style.input}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#10b981' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#333' }}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            ...style.sendBtn,
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { if (!loading && input.trim()) e.currentTarget.style.background = '#059669' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#10b981' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Enviar
        </button>
      </div>
    </div>
  )
}
