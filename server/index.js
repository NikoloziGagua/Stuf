import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const app = express()
const port = Number(process.env.PORT) || 4000

app.use(cors())
app.use(express.json({ limit: '25mb' }))

const apiKey = process.env.OPENAI_API_KEY
const client = apiKey ? new OpenAI({ apiKey }) : null
const provider =
  process.env.AI_PROVIDER || (client ? 'openai' : 'ollama')
const ollamaHost = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(
  /\/+$/,
  '',
)
const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b'

const syncToken = process.env.SYNC_TOKEN
const dataDir = path.resolve(process.cwd(), 'server', 'data')
const uploadsDir = path.resolve(process.cwd(), 'server', 'uploads')
const syncFile = path.join(dataDir, 'sync.json')

fs.mkdirSync(dataDir, { recursive: true })
fs.mkdirSync(uploadsDir, { recursive: true })

app.use('/uploads', express.static(uploadsDir))

const getAuthToken = (req) => {
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) {
    return header.slice(7)
  }
  return req.headers['x-sync-token']
}

const requireSyncAuth = (req, res, next) => {
  if (!syncToken) {
    next()
    return
  }
  const token = getAuthToken(req)
  if (token && token === syncToken) {
    next()
    return
  }
  res.status(401).json({ error: 'Unauthorized' })
}

const readSyncData = () => {
  if (!fs.existsSync(syncFile)) {
    return { updatedAt: null }
  }
  try {
    const raw = fs.readFileSync(syncFile, 'utf8')
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed ? parsed : { updatedAt: null }
  } catch (error) {
    console.error('Failed to read sync file', error)
    return { updatedAt: null }
  }
}

const writeSyncData = (payload) => {
  const next = {
    ...payload,
    updatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(syncFile, JSON.stringify(next, null, 2))
  return next
}

const modelFallbacks = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini']
const buildModelList = () => {
  const candidates = [
    process.env.OPENAI_MODEL,
    ...modelFallbacks,
  ].filter(Boolean)
  return [...new Set(candidates)]
}

const isModelError = (error) => {
  const status = error?.status
  const code = error?.error?.code || error?.code
  const message = error?.error?.message || error?.message || ''
  return (
    status === 404 ||
    code === 'model_not_found' ||
    /model.*not found/i.test(message) ||
    /does not exist/i.test(message)
  )
}

const callOpenAi = async (messages, options = {}) => {
  if (!client) {
    throw new Error('Missing OPENAI_API_KEY')
  }
  const models = buildModelList()
  let completion = null
  let modelUsed = models[0] || 'gpt-4o-mini'
  let lastError = null

  for (const model of models) {
    try {
      completion = await client.chat.completions.create({
        model,
        messages,
        temperature: 0.4,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      })
      modelUsed = model
      break
    } catch (error) {
      if (isModelError(error)) {
        lastError = error
        continue
      }
      throw error
    }
  }

  if (!completion) {
    throw lastError || new Error('No available model')
  }

  const text = completion.choices?.[0]?.message?.content?.trim() ?? ''
  return { text, model: modelUsed }
}

const callOllama = async (messages, options = {}) => {
  const response = await fetch(`${ollamaHost}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages,
      stream: false,
      format: options.jsonMode ? 'json' : undefined,
      options: { temperature: 0.4 },
    }),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Ollama request failed')
  }
  const data = await response.json()
  const text = data?.message?.content?.trim() ?? ''
  return { text, model: ollamaModel }
}

const buildContextBlock = (context) =>
  [
    `Kind: ${context.kind ?? 'unknown'}`,
    `Scope: ${context.scope ?? 'summary'}`,
    `Title: ${context.title ?? 'Untitled'}`,
    `Range: ${context.range ?? 'n/a'}`,
    context.focus ? `Focus: ${context.focus}` : null,
    context.summary ? `Summary: ${context.summary}` : null,
    context.prompt ? `Prompt: ${context.prompt}` : null,
    context.draft ? `Draft: ${context.draft}` : null,
    context.readingText ? `Reading text: ${context.readingText}` : null,
  ]
    .filter(Boolean)
    .join('\n')

const buildTask = (action, context) => {
  if (action === 'draft') {
    if (context.scope === 'summary') {
      if (context.kind === 'phase') {
        return 'Write a long-form narrative (4-6 paragraphs) based on the context.'
      }
      return 'Write a concise 3-5 sentence summary based on the context.'
    }
    return 'Write a clear working draft (3-6 paragraphs) based on the prompt and context.'
  }
  if (action === 'edit') {
    if (context.scope === 'summary') {
      if (context.kind === 'phase') {
        return 'Revise the narrative for clarity, structure, and flow. Keep it 4-6 paragraphs.'
      }
      return 'Revise the summary for clarity and precision in 3-5 sentences.'
    }
    return 'Revise the draft for clarity, structure, and evidence alignment. Keep the length similar.'
  }
  if (action === 'overview') {
    return 'Provide a concise high-level overview in 4-6 sentences. Avoid citations.'
  }
  if (action === 'chat') {
    return 'Answer the user question and suggest concrete edits or next steps.'
  }
  if (action === 'setup') {
    if (context.scope === 'subphase') {
      return [
        'Create a minimal subphase setup from the context.',
        'Return JSON only with keys: title, range, prompt.',
        'Keep values concise and specific.',
        'Do not include any extra text or code fences.',
      ].join(' ')
    }
    const target = context.kind === 'entity' ? 'entry' : 'phase'
    return [
      `Create a minimal ${target} setup from the context.`,
      'Return JSON only with keys:',
      'title, range, summary, subphaseTitle, subphaseRange, subphasePrompt, themes, questions.',
      'Write the summary as 2-4 short paragraphs.',
      'Keep prompts concise but informative.',
      'Do not include any extra text or code fences.',
    ].join(' ')
  }
  return 'Provide a helpful response based on the context.'
}

app.get('/api/sync', requireSyncAuth, (req, res) => {
  res.json(readSyncData())
})

app.post('/api/sync', requireSyncAuth, (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Invalid payload' })
    return
  }
  try {
    const stored = writeSyncData(req.body)
    res.json({ ok: true, updatedAt: stored.updatedAt })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to write sync data' })
  }
})

app.post('/api/upload', requireSyncAuth, (req, res) => {
  const { fileName, fileType, data } = req.body ?? {}
  if (!fileName || !data || typeof data !== 'string') {
    res.status(400).json({ error: 'Missing file payload' })
    return
  }
  const safeBase = String(fileName).replace(/[^\w.-]/g, '_') || 'upload'
  const uniqueName = `${Date.now()}-${safeBase}`
  const target = path.join(uploadsDir, uniqueName)
  const base64 = data.includes('base64,') ? data.split('base64,')[1] : data

  try {
    const buffer = Buffer.from(base64, 'base64')
    fs.writeFileSync(target, buffer)
    res.json({
      url: `/uploads/${uniqueName}`,
      fileName: safeBase,
      fileType: fileType || '',
      size: buffer.length,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to store file' })
  }
})

app.post('/api/ai', async (req, res) => {
  const { action, context, message, chatHistory } = req.body ?? {}
  if (!action || !context) {
    res.status(400).json({ error: 'Missing action or context' })
    return
  }
  if (!['draft', 'edit', 'overview', 'chat', 'setup'].includes(action)) {
    res.status(400).json({ error: 'Unsupported action' })
    return
  }
  const systemPrompt = [
    'You are a history research assistant in a learning app.',
    'Use only the provided context; do not invent citations or sources.',
    'If details are missing, ask one clarifying question.',
    'Return plain text only.',
  ].join(' ')
  const contextBlock = buildContextBlock(context)
  const task = buildTask(action, context)

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: `Context:\n${contextBlock}` },
    ]
    if (action === 'chat') {
      messages.push({ role: 'system', content: task })
      const history = Array.isArray(chatHistory)
        ? chatHistory
            .filter(
              (entry) =>
                entry &&
                (entry.role === 'user' || entry.role === 'assistant') &&
                typeof entry.content === 'string',
            )
            .slice(-8)
        : []
      messages.push(...history)
      messages.push({
        role: 'user',
        content: message || 'Continue the conversation with useful guidance.',
      })
    } else {
      const guidance =
        typeof message === 'string' && message.trim()
          ? `User direction: ${message.trim()}`
          : null
      messages.push({
        role: 'user',
        content: [task, guidance, contextBlock].filter(Boolean).join('\n\n'),
      })
    }

    const jsonMode = action === 'setup'
    const result =
      provider === 'openai'
        ? await callOpenAi(messages, { jsonMode })
        : await callOllama(messages, { jsonMode })
    res.json({ ...result, provider })
  } catch (error) {
    console.error(error)
    if (provider === 'ollama') {
      res.status(503).json({
        error:
          'Ollama is not reachable. Make sure it is running and the model is downloaded.',
      })
      return
    }
    res.status(500).json({ error: 'AI request failed' })
  }
})

app.listen(port, () => {
  console.log(`AI server listening on ${port}`)
})
