'use strict';

const http = require('http');
const { getStats, getCalls, addCall, addBudget, removeBudget, ackAlert, subscribe, state } = require('./core');

const PORT = parseInt(process.env.LCG_PORT || '47821');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => (b += c));
    req.on('end', () => {
      try { resolve(JSON.parse(b || '{}')); }
      catch (e) { reject(e); }
    });
  });
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function send(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(body);
}

function createServer() {
  const server = http.createServer(async (req, res) => {
    const url    = new URL(req.url || '/', `http://localhost`);
    const path   = url.pathname;
    const method = req.method || 'GET';

    // CORS preflight
    if (method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }

    // SSE — live push to dashboard
    if (path === '/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        Connection: 'keep-alive',
      });
      const push = () => {
        try { res.write(`data: ${JSON.stringify(getStats())}\n\n`); } catch (_) {}
      };
      push();
      const unsub = subscribe(push);
      req.on('close', unsub);
      return;
    }

    // REST API
    if (path === '/api/stats')  { send(res, getStats()); return; }

    if (path === '/api/calls') {
      const limit  = parseInt(url.searchParams.get('limit') || '100');
      const userId = url.searchParams.get('userId') || undefined;
      send(res, getCalls(limit, userId));
      return;
    }

    if (path === '/api/track' && method === 'POST') {
      try {
        const body = await parseBody(req);
        addCall(body);
        send(res, { ok: true });
      } catch (e) { send(res, { error: 'Invalid JSON' }, 400); }
      return;
    }

    if (path === '/api/budgets') {
      if (method === 'GET')  { send(res, state.budgets); return; }
      if (method === 'POST') {
        try { send(res, addBudget(await parseBody(req)), 201); }
        catch (e) { send(res, { error: 'Invalid JSON' }, 400); }
        return;
      }
    }

    const bdel = path.match(/^\/api\/budgets\/(.+)$/);
    if (bdel && method === 'DELETE') { removeBudget(bdel[1]); send(res, { ok: true }); return; }

    if (path === '/api/alerts/ack' && method === 'POST') {
      try {
        const { id, all } = await parseBody(req);
        ackAlert(all ? '__all__' : id);
        send(res, { ok: true });
      } catch (e) { send(res, { error: 'Invalid JSON' }, 400); }
      return;
    }

    // Serve dashboard HTML for everything else
    const { getDashboardHTML } = require('./dashboard');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getDashboardHTML(PORT));
  });

  return server;
}

function startServer() {
  const server = createServer();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[llm-cost-guard] Port ${PORT} is already in use.`);
      console.error(`[llm-cost-guard] Kill the existing process or set LCG_PORT=XXXX`);
      process.exit(1);
    }
    throw err;
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n🛡️  llm-cost-guard running`);
    console.log(`   Dashboard → http://localhost:${PORT}\n`);
  });

  return server;
}

module.exports = { createServer, startServer, PORT };
