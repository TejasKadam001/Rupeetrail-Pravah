import {env} from 'cloudflare:workers';

export async function claudeText(request: Request, system: string, evidence: string, maxTokens = 330) {
  const runtime = env as {ANTHROPIC_API_KEY?:string; ANTHROPIC_MODEL?:string};
  if (!runtime.ANTHROPIC_API_KEY || !request.headers.get('oai-authenticated-user-id')) return null;
  if (request.headers.get('origin') !== new URL(request.url).origin) return null;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'x-api-key':runtime.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},
      body: JSON.stringify({model:runtime.ANTHROPIC_MODEL || 'claude-haiku-5-5', max_tokens:maxTokens, system,
        messages:[{role:'user',content:evidence}]}), signal:AbortSignal.timeout(12000)
    });
    if (!response.ok) return null;
    const payload = await response.json() as {content:{type:string;text?:string}[]};
    return payload.content.filter(c => c.type === 'text').map(c => c.text).join('\n').trim() || null;
  } catch { return null; }
}
