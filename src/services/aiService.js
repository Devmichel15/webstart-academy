const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions'

const SYSTEM_PROMPT = `You are an expert web development tutor (HTML/CSS/JS) at WebStart Academy.
Your teaching style combines Khan Academy (educational, progressive), StackOverflow (precise, technical), and a senior mentor (explains the "why").
Rules:
- NEVER give just the answer — always explain the reasoning
- Analyze code for semantic correctness, accessibility, SEO, best practices
- Explain WHY something is wrong, not just WHAT
- Respond in Brazilian Portuguese
- Return ONLY valid JSON. No greetings, no explanations, no markdown, no code fences. NOTHING except the JSON object.

You must respond with exactly this JSON and nothing else:
{
  "feedback": "detailed explanation in Portuguese",
  "score": number from 0 to 100,
  "mistakes": ["specific errors"],
  "improvements": ["professional suggestions"],
  "explanation": "in-depth concept explanation"
}`

const token = () => {
  const key =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.HF_API_KEY) ||
    null
  if (!key) console.warn('[AI] API key not found. Set VITE_API_KEY in .env')
  return key
}

const cache = new Map()
const requestTimestamps = []

const RATE_LIMIT = 10
const RATE_WINDOW = 60000
const CACHE_TTL = 300000

function getCacheKey(data) {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return `ai_${hash}`
}

function checkRateLimit() {
  const now = Date.now()
  while (requestTimestamps.length && requestTimestamps[0] < now - RATE_WINDOW) {
    requestTimestamps.shift()
  }
  if (requestTimestamps.length >= RATE_LIMIT) {
    throw new Error(`Limite de ${RATE_LIMIT} requisições por minuto. Aguarde um pouco.`)
  }
  requestTimestamps.push(now)
}

export async function callAI({ type, userAnswer, lessonContext, exercisePrompt }) {
  const apiKey = token()
  if (!apiKey) {
    return {
      feedback: 'Configure a chave da API no arquivo .env (VITE_API_KEY).',
      score: 0,
      mistakes: ['API key não configurada'],
      improvements: ['Adicionar VITE_API_KEY ao .env com sua chave do Hugging Face'],
      explanation: 'A WebStart usa Hugging Face Inference API para o tutor AI. Você precisa configurar uma chave de API no arquivo .env do projeto.',
    }
  }

  const cacheKey = getCacheKey({ type, userAnswer, lessonContext, exercisePrompt })
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  checkRateLimit()

  let context = lessonContext ? `Contexto da aula: ${lessonContext}\n\n` : ''

  let userPrompt
  switch (type) {
    case 'exercise_check':
      userPrompt = `${context}Exercício: ${exercisePrompt || 'Sem descrição'}

Resposta do aluno:
\`\`\`html
${userAnswer || 'Nenhum código fornecido'}
\`\`\`

Analise este código HTML. Avalie estrutura semântica, uso de tags, acessibilidade, SEO, organização.`
      break
    case 'question':
      userPrompt = `${context}Pergunta do aluno: ${userAnswer || 'Sem pergunta'}

Responda com explicação detalhada em português. score: 100, mistakes: [], improvements: []`
      break
    case 'explain':
      userPrompt = `${context}Explique: ${exercisePrompt || 'Sem tópico'}
Contexto: ${userAnswer || 'Sem contexto'}

Explique de forma progressiva: o que é, como usar, por que é importante, boas práticas.`
      break
    default:
      userPrompt = `Consulte: ${exercisePrompt || ''}\nDúvida: ${userAnswer || ''}`
  }

  let response
  try {
    response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:groq',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1024,
        temperature: 0.3,
        top_p: 0.9,
      }),
    })
  } catch (fetchErr) {
    throw new Error('Erro de rede ao contactar a IA. Verifica a tua ligação à internet.')
  }

  if (!response.ok) {
    let errBody = ''
    try {
      errBody = await response.text()
    } catch {
      // ignore text read error
    }
    console.error(`[AI] HTTP ${response.status}:`, errBody)

    if (response.status === 503 || response.status === 502) {
      return {
        feedback: 'O modelo está a carregar. Aguarda uns segundos e tenta de novo.',
        score: 0,
        mistakes: [],
        improvements: ['Tentar novamente em alguns instantes'],
        explanation: 'Modelo em loading no Hugging Face.',
      }
    }
    throw new Error(`Erro ${response.status} ao contactar a IA. Tenta novamente.`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    console.error('[AI] Resposta não-JSON:', text.slice(0, 500))
    throw new Error('A IA retornou uma resposta inesperada. Tenta novamente.')
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Resposta da IA inválida. Tenta novamente.')
  }

  let text = ''
  if (data.choices?.[0]?.message?.content) {
    text = data.choices[0].message.content
  }

  const result = parseResponse(text)
  cache.set(cacheKey, { data: result, timestamp: Date.now() })
  return result
}

function parseResponse(text) {
  const fallback = (msg) => ({
    feedback: msg || 'Não foi possível analisar. Tenta reformular.',
    score: 50,
    mistakes: [],
    improvements: ['Tenta ser mais específico na pergunta ou código.'],
    explanation: '',
  })

  if (!text) return fallback()

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const cleaned = jsonMatch
      ? jsonMatch[0].replace(/```json|```/g, '').trim()
      : text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      feedback: parsed.feedback || 'Análise concluída.',
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0,
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      explanation: parsed.explanation || parsed.nextStep || '',
    }
  } catch {
    return fallback()
  }
}

export function clearAICache() {
  cache.clear()
}
