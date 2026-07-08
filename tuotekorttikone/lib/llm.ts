// Provider-pohjainen LLM-jäsennys Smart Importiin.
// Vaihda malli/tarjoaja .env-tiedostosta — koodi ei muutu.
// Ilman API-avainta käytetään heuristista jäsennintä (lib/parser.ts).
import { parseRawText, type ParsedCard } from './parser'

export type LlmProvider = 'anthropic' | 'openai' | 'heuristic'

export function activeProvider(): LlmProvider {
  const p = (process.env.LLM_PROVIDER ?? '').toLowerCase()
  if (p === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (p === 'openai' && process.env.OPENAI_API_KEY) return 'openai'
  if (!p || p === 'heuristic') {
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
    if (process.env.OPENAI_API_KEY) return 'openai'
  }
  return 'heuristic'
}

const SYSTEM = `Olet ravintolan tuotekorttien jäsennysapuri. Saat raakatekstiä (resepti, luonnos, WhatsApp-viesti, taulukko).
Palauta VAIN validi JSON ilman selityksiä, muoto:
{"kind":"product"|"misa","name":str,"description":str?,"category":str?,
"ingredients":[{"name":str,"amount":str,"unit":str}],
"instructions":str?,"assembly":str?,"serving":str?,"storage":str?,"shelfLife":str?,
"temperatures":str?,"prepTime":str?,"yieldAmount":str?,"portionSize":str?,"portionWeight":str?,
"price":str?,"allergens":[avaimet: gluten,milk,egg,fish,crustacean,soy,nuts,peanut,celery,mustard,sesame,sulphite,lupin,mollusc],
"allergenOther":str?,"container":str?,"storageTemp":str?,"dosing":str?,"usedIn":str?}
Kaikki tekstit suomeksi. Älä keksi tietoja joita tekstissä ei ole.`

async function parseWithAnthropic(raw: string): Promise<ParsedCard> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: 'user', content: raw }],
  })
  const text = msg.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
  return extractJson(text)
}

async function parseWithOpenAI(raw: string): Promise<ParsedCard> {
  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: raw },
    ],
    response_format: { type: 'json_object' },
  })
  return extractJson(res.choices[0]?.message?.content ?? '{}')
}

function extractJson(text: string): ParsedCard {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  const json = JSON.parse(text.slice(start, end + 1)) as Partial<ParsedCard>
  return {
    kind: json.kind === 'misa' ? 'misa' : 'product',
    ingredients: Array.isArray(json.ingredients) ? json.ingredients : [],
    allergens: Array.isArray(json.allergens) ? json.allergens : [],
    ...json,
  } as ParsedCard
}

export async function smartParse(raw: string): Promise<{ parsed: ParsedCard; provider: LlmProvider }> {
  const provider = activeProvider()
  try {
    if (provider === 'anthropic') return { parsed: await parseWithAnthropic(raw), provider }
    if (provider === 'openai') return { parsed: await parseWithOpenAI(raw), provider }
  } catch (err) {
    console.error('LLM-jäsennys epäonnistui, käytetään heuristiikkaa:', err)
  }
  return { parsed: parseRawText(raw), provider: 'heuristic' }
}
