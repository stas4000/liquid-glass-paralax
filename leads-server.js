const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 9052);
const DATA_FILE = process.env.LEADS_FILE || path.join(__dirname, 'leads.jsonl');
const MAX_BODY_BYTES = 32768;

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function clean(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
        reject(new Error('request_too_large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleContact(req, res) {
  let payload;
  try {
    const raw = await collectBody(req);
    payload = JSON.parse(raw || '{}');
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: 'Invalid request' });
  }

  const lead = {
    received_at: new Date().toISOString(),
    name: clean(payload.name, 120),
    contact: clean(payload.contact, 180),
    interest: clean(payload.interest, 120),
    details: clean(payload.details, 1600),
    source: clean(payload.source, 120),
    page: clean(payload.page, 260),
    user_agent: clean(req.headers['user-agent'], 260),
    ip: clean(req.headers['x-forwarded-for'] || req.socket.remoteAddress, 120)
  };

  if (!lead.name || !lead.contact || !lead.interest) {
    return sendJson(res, 400, { ok: false, error: 'Name, contact, and interest are required' });
  }

  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.appendFileSync(DATA_FILE, JSON.stringify(lead) + '\n', 'utf8');
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: 'Could not store request' });
  }

  return sendJson(res, 200, { ok: true });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method === 'GET' && url.pathname === '/healthz') {
    return sendJson(res, 200, { ok: true, service: 'teleclaudius-leads' });
  }

  if (req.method === 'POST' && url.pathname === '/api/contact') {
    return handleContact(req, res);
  }

  return sendJson(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`teleclaudius-leads listening on 127.0.0.1:${PORT}`);
});
