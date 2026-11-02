// Servidor do Assistente: serve o app e responde perguntas usando Claude + busca web.
// Uso: ANTHROPIC_API_KEY=sua_chave node server.js   (Node 18+)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3300;
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
const TOKEN = process.env.APP_TOKEN || ''; // opcional: exige o mesmo token no app
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.md': 'text/markdown; charset=utf-8', '.png': 'image/png'
};

const SYSTEM = 'Você é o pesquisador de um assistente pessoal. Responda sempre em português do Brasil, ' +
  'de forma direta e curta (no máximo 5 frases), usando a busca na web quando a pergunta depender de ' +
  'informação atual ou factual. Não use markdown pesado nem listas longas. Se não encontrar, diga isso.';

async function askClaude(q) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      messages: [{ role: 'user', content: q }]
    })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Erro na API (' + r.status + ')');
  let text = '';
  const sources = new Map();
  for (const b of j.content || []) {
    if (b.type === 'text') {
      text += b.text;
      for (const c of b.citations || []) if (c.url && !sources.has(c.url)) sources.set(c.url, c.title || c.url);
    } else if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
      for (const s of b.content) if (s.url && sources.size < 3 && !sources.has(s.url)) sources.set(s.url, s.title || s.url);
    }
  }
  return { text: text.trim(), sources: [...sources].slice(0, 3).map(([url, title]) => ({ url, title })) };
}

function readBody(req) {
  return new Promise((ok, fail) => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 20000) { fail(new Error('grande')); req.destroy(); } });
    req.on('end', () => ok(d));
    req.on('error', fail);
  });
}

const send = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');

  if (req.method === 'POST' && url.pathname === '/api/ask') {
    if (!KEY) return send(res, 503, { error: 'ANTHROPIC_API_KEY não configurada no servidor.' });
    if (TOKEN && req.headers['x-app-token'] !== TOKEN) return send(res, 401, { error: 'Token inválido.' });
    try {
      const { q } = JSON.parse(await readBody(req));
      if (!q || typeof q !== 'string' || q.length > 500) return send(res, 400, { error: 'Pergunta inválida.' });
      return send(res, 200, await askClaude(q.trim()));
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/status') return send(res, 200, { ok: true, ai: !!KEY });

  // arquivos estáticos (somente os do app)
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  const allowed = ['index.html', 'manifest.json', 'sw.js', 'icon.svg'];
  if (!file.startsWith(ROOT + path.sep) || !allowed.includes(path.basename(file)) || path.dirname(file) !== ROOT) {
    res.writeHead(404); return res.end('Não encontrado');
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Assistente em http://localhost:${PORT}  (IA: ${KEY ? 'ligada' : 'SEM chave — usando só Wikipédia'})`);
});
