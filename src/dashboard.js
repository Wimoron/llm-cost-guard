'use strict';

function getDashboardHTML(port) {
  port = port || 47821;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>llm-cost-guard</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;background:#0a0a0f;color:#e2e2e8;min-height:100vh}
:root{--s:#13131a;--s2:#1c1c26;--b:#2a2a38;--ac:#7c6af7;--gn:#22c55e;--rd:#ef4444;--am:#f59e0b;--mu:#6b6b80;--dm:#3a3a50}
.shell{display:grid;grid-template-columns:210px 1fr;min-height:100vh}
.side{background:var(--s);border-right:1px solid var(--b);display:flex;flex-direction:column}
.brand{padding:18px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--b)}
.bi{width:32px;height:32px;background:var(--ac);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.bn{font-size:13px;font-weight:700}.bs{font-size:10px;color:var(--mu);margin-top:1px}
.ni{display:flex;align-items:center;gap:9px;padding:9px 16px;cursor:pointer;color:var(--mu);font-size:13px;border-left:2px solid transparent;transition:all .12s}
.ni:hover{color:#e2e2e8;background:var(--s2)}.ni.on{color:#e2e2e8;background:var(--s2);border-left-color:var(--ac)}
.ni i{font-size:15px;width:16px;text-align:center}
.ns{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--mu);padding:14px 16px 5px;font-weight:600}
.main{display:flex;flex-direction:column;overflow:hidden}
.topbar{background:var(--s);border-bottom:1px solid var(--b);height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.ld{width:7px;height:7px;border-radius:50%;background:var(--gn);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.pt{font-size:14px;font-weight:600}
.btn{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:7px;border:1px solid var(--b);background:var(--s2);color:#e2e2e8;font-size:12px;cursor:pointer;transition:all .12s;font-family:inherit}
.btn:hover{border-color:var(--ac)}.btn.pr{background:var(--ac);border-color:var(--ac);color:#fff}.btn.pr:hover{background:#5b50cc}
.btn.dr{border-color:var(--rd);color:var(--rd);background:transparent}.btn.dr:hover{background:rgba(239,68,68,.1)}
.cnt{padding:22px 24px;flex:1;overflow-y:auto}
.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.sc{background:var(--s);border:1px solid var(--b);border-radius:11px;padding:16px 18px;position:relative}
.sl{font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px}
.sv{font-size:24px;font-weight:700;letter-spacing:-1px;line-height:1}.ss{font-size:11px;color:var(--mu);margin-top:5px}
.si{position:absolute;top:14px;right:14px;font-size:20px;color:var(--dm)}
.cr{display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:20px}
.cd{background:var(--s);border:1px solid var(--b);border-radius:11px;padding:18px}
.ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.ct{font-size:13px;font-weight:600}.cs{font-size:11px;color:var(--mu)}
.tg{display:flex;gap:2px;background:var(--s2);border-radius:7px;padding:3px}
.tb{padding:3px 10px;border-radius:5px;font-size:11px;cursor:pointer;color:var(--mu)}.tb.on{background:var(--s);color:#e2e2e8}
.cw{height:170px;position:relative}
.br{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;padding:7px 9px;font-size:10px;font-weight:600;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--b)}
td{padding:8px 9px;border-bottom:1px solid var(--b)}
tr:last-child td{border-bottom:none}tr:hover td{background:var(--s2)}
.bg{display:inline-flex;padding:2px 7px;border-radius:99px;font-size:11px;font-weight:500}
.bo{background:rgba(16,163,127,.15);color:#10a37f}.ba{background:rgba(209,154,102,.15);color:#d19a66}.bgg{background:rgba(66,133,244,.15);color:#4285f4}
.bk{background:rgba(239,68,68,.15);color:var(--rd)}.bv{background:rgba(34,197,94,.15);color:var(--gn)}
.ai{background:var(--s2);border:1px solid var(--b);border-radius:9px;padding:11px 13px;display:flex;align-items:flex-start;gap:9px;margin-bottom:7px}
.ai.cr2{border-left:3px solid var(--rd)}.ai.wr{border-left:3px solid var(--am)}
.aic{font-size:15px;margin-top:1px}.cr2 .aic{color:var(--rd)}.wr .aic{color:var(--am)}
.am2{font-size:12px;font-weight:500;line-height:1.4}.at{font-size:11px;color:var(--mu);margin-top:3px}
.ab{background:none;border:none;color:var(--mu);cursor:pointer;font-size:12px;padding:2px}.ab:hover{color:#e2e2e8}
.bui{background:var(--s2);border:1px solid var(--b);border-radius:9px;padding:12px 14px;margin-bottom:7px}
.bbt{height:5px;background:var(--dm);border-radius:99px;overflow:hidden;margin:5px 0}
.bbf{height:100%;border-radius:99px;transition:width .5s}.fs{background:var(--gn)}.fw{background:var(--am)}.fo{background:var(--rd)}
.hc{font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(239,68,68,.15);color:var(--rd)}
.sc2{font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(124,106,247,.15);color:var(--ac)}
.mb{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:99;opacity:0;pointer-events:none;transition:opacity .15s}
.mb.op{opacity:1;pointer-events:all}
.mo{background:var(--s);border:1px solid var(--b);border-radius:13px;padding:22px;width:380px;transform:translateY(8px);transition:transform .15s}
.mb.op .mo{transform:translateY(0)}
.mt{font-size:14px;font-weight:700;margin-bottom:16px}
.fl{margin-bottom:13px}.fl label{display:block;font-size:10px;font-weight:600;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
.fl input,.fl select{width:100%;background:var(--s2);border:1px solid var(--b);border-radius:7px;padding:8px 11px;color:#e2e2e8;font-size:13px;font-family:inherit;outline:none;transition:border-color .12s}
.fl input:focus,.fl select:focus{border-color:var(--ac)}
.ma{display:flex;gap:7px;margin-top:18px}
.tgr{display:flex;align-items:center;justify-content:space-between}
.tgl{position:relative;width:34px;height:19px;cursor:pointer;display:inline-block}
.tgl input{opacity:0;width:0;height:0}
.tsl{position:absolute;inset:0;background:var(--dm);border-radius:99px;transition:.15s}
.tgl input:checked+.tsl{background:var(--ac)}
.tsl::before{content:'';position:absolute;width:13px;height:13px;border-radius:50%;background:#fff;top:3px;left:3px;transition:.15s}
.tgl input:checked+.tsl::before{transform:translateX(15px)}
.pg{display:none}.pg.on{display:block}
.empty{display:flex;flex-direction:column;align-items:center;padding:36px;color:var(--mu);gap:7px;text-align:center}
.empty i{font-size:28px;opacity:.3}.empty p{font-size:12px;line-height:1.6}
.pr-row{margin-bottom:9px}
.pm{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
.pbt{height:4px;background:var(--s2);border-radius:99px;overflow:hidden}
.pbf{height:100%;border-radius:99px}
code{background:var(--s2);padding:2px 6px;border-radius:4px;font-size:12px}
.cmd{background:var(--s2);border:1px solid var(--b);border-radius:8px;padding:11px 14px;font-family:monospace;font-size:12px;color:#a78bfa;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px;line-height:1.7}
.cp{background:none;border:none;color:var(--mu);cursor:pointer;font-size:13px;flex-shrink:0;padding:0}.cp:hover{color:#e2e2e8}
.badge-count{margin-left:auto;background:var(--rd);color:#fff;font-size:10px;padding:1px 6px;border-radius:99px;display:none}
</style>
</head>
<body>
<div class="shell">
<nav class="side">
  <div class="brand">
    <div class="bi"><i class="ti ti-shield-bolt" style="color:#fff;font-size:17px"></i></div>
    <div><div class="bn">cost-guard</div><div class="bs">LLM cost dashboard</div></div>
  </div>
  <span class="ns">Monitor</span>
  <div class="ni on" data-p="overview"><i class="ti ti-layout-dashboard"></i> Overview</div>
  <div class="ni" data-p="calls"><i class="ti ti-list-details"></i> Call log</div>
  <div class="ni" data-p="alerts">
    <i class="ti ti-bell"></i> Alerts
    <span class="badge-count" id="abadge"></span>
  </div>
  <span class="ns">Control</span>
  <div class="ni" data-p="budgets"><i class="ti ti-wallet"></i> Budgets</div>
  <div class="ni" data-p="setup"><i class="ti ti-terminal-2"></i> Setup</div>
</nav>

<div class="main">
  <div class="topbar">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="ld" id="dot"></div>
      <span class="pt" id="ptitle">Overview</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span id="lupd" style="font-size:11px;color:var(--mu)">Connecting…</span>
      <button class="btn" onclick="load()"><i class="ti ti-refresh"></i></button>
    </div>
  </div>

  <div class="cnt">

    <!-- OVERVIEW -->
    <div class="pg on" id="pg-overview">
      <div class="sg">
        <div class="sc"><i class="ti ti-sun si"></i>
          <div class="sl">Today</div><div class="sv" id="s-today">—</div><div class="ss" id="s-calls">—</div>
        </div>
        <div class="sc"><i class="ti ti-calendar-week si"></i>
          <div class="sl">This week</div><div class="sv" id="s-week">—</div><div class="ss">7-day total</div>
        </div>
        <div class="sc"><i class="ti ti-users si"></i>
          <div class="sl">Active users</div><div class="sv" id="s-users">—</div><div class="ss">last 24 h</div>
        </div>
        <div class="sc"><i class="ti ti-bell si"></i>
          <div class="sl">Alerts</div><div class="sv" id="s-alc">—</div><div class="ss">unacknowledged</div>
        </div>
      </div>
      <div class="cr">
        <div class="cd">
          <div class="ch">
            <div><div class="ct">Spend over time</div><div class="cs">Hourly · last 24 h</div></div>
            <div class="tg">
              <div class="tb on" onclick="setMode('cost',this)">Cost</div>
              <div class="tb" onclick="setMode('calls',this)">Calls</div>
            </div>
          </div>
          <div class="cw"><canvas id="chart"></canvas></div>
        </div>
        <div class="cd">
          <div class="ch"><div class="ct">By provider</div></div>
          <div id="provs"><div class="empty"><i class="ti ti-plug"></i><p>No calls yet</p></div></div>
        </div>
      </div>
      <div class="br">
        <div class="cd">
          <div class="ch"><div class="ct">Top users today</div></div>
          <table><thead><tr><th>User</th><th>Calls</th><th>Cost</th></tr></thead>
          <tbody id="tub"></tbody></table>
        </div>
        <div class="cd">
          <div class="ch"><div class="ct">Recent alerts</div>
            <button class="btn" style="padding:4px 8px" onclick="nav('alerts')"><i class="ti ti-arrow-right"></i></button>
          </div>
          <div id="oval"></div>
        </div>
      </div>
    </div>

    <!-- CALL LOG -->
    <div class="pg" id="pg-calls">
      <div class="cd">
        <div class="ch"><div class="ct">Call log</div>
          <div style="display:flex;gap:7px">
            <input id="uf" placeholder="Filter by user…" oninput="renderCalls()"
              style="background:var(--s2);border:1px solid var(--b);border-radius:7px;padding:5px 10px;color:#e2e2e8;font-size:12px;font-family:inherit;outline:none;width:140px">
            <select id="pf" onchange="renderCalls()"
              style="background:var(--s2);border:1px solid var(--b);border-radius:7px;padding:5px 10px;color:#e2e2e8;font-size:12px;font-family:inherit;outline:none">
              <option value="">All providers</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>
        </div>
        <table>
          <thead><tr><th>Time</th><th>User</th><th>Provider</th><th>Model</th><th>Tokens</th><th>Cost</th><th>ms</th></tr></thead>
          <tbody id="cb"></tbody>
        </table>
      </div>
    </div>

    <!-- ALERTS -->
    <div class="pg" id="pg-alerts">
      <div class="cd">
        <div class="ch"><div class="ct">Active alerts</div>
          <button class="btn" id="aabtn" onclick="ackAll()" style="display:none"><i class="ti ti-checks"></i> Clear all</button>
        </div>
        <div id="alist"></div>
      </div>
    </div>

    <!-- BUDGETS -->
    <div class="pg" id="pg-budgets">
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
        <button class="btn pr" onclick="openM()"><i class="ti ti-plus"></i> Add limit</button>
      </div>
      <div id="blist"></div>
    </div>

    <!-- SETUP -->
    <div class="pg" id="pg-setup">
      <div class="cd" style="margin-bottom:12px">
        <div class="ch"><div class="ct">Track your LLM calls</div></div>
        <p style="font-size:12px;color:var(--mu);margin-bottom:14px;line-height:1.8">Add one line to your app. Every call is automatically tracked here.</p>

        <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px">Install</div>
        <div class="cmd">
          <span>npm install llm-cost-guard</span>
          <button class="cp" onclick="copy('npm install llm-cost-guard')"><i class="ti ti-copy"></i></button>
        </div>

        <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin:12px 0 7px">OpenAI</div>
        <div class="cmd" style="flex-direction:column">
          <span>import { patch } from 'llm-cost-guard';</span>
          <span>import OpenAI from 'openai';</span>
          <span>&nbsp;</span>
          <span>const openai = patch(new OpenAI());</span>
          <span style="color:var(--mu)">// use openai exactly as before — tracking is automatic</span>
          <button class="cp" style="align-self:flex-end" onclick="copy(\`import { patch } from 'llm-cost-guard';\nimport OpenAI from 'openai';\n\nconst openai = patch(new OpenAI());\`)"><i class="ti ti-copy"></i></button>
        </div>

        <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin:12px 0 7px">Anthropic</div>
        <div class="cmd" style="flex-direction:column">
          <span>import { patch } from 'llm-cost-guard';</span>
          <span>import Anthropic from '@anthropic-ai/sdk';</span>
          <span>&nbsp;</span>
          <span>const anthropic = patch(new Anthropic());</span>
          <button class="cp" style="align-self:flex-end" onclick="copy(\`import { patch } from 'llm-cost-guard';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = patch(new Anthropic());\`)"><i class="ti ti-copy"></i></button>
        </div>

        <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin:12px 0 7px">Any language — HTTP API</div>
        <div class="cmd" style="flex-direction:column">
          <span style="color:var(--mu)"># POST to track any call manually</span>
          <span>curl -X POST http://localhost:${port}/api/track \\</span>
          <span>&nbsp; -H "Content-Type: application/json" \\</span>
          <span>&nbsp; -d '{"provider":"openai","model":"gpt-4o","promptTokens":100,"completionTokens":50,"totalTokens":150,"costUSD":0.00125,"latencyMs":450,"userId":"alice"}'</span>
          <button class="cp" style="align-self:flex-end" onclick="copy('curl -X POST http://localhost:${port}/api/track -H \\"Content-Type: application/json\\" -d \\'{\\"provider\\":\\"openai\\",\\"model\\":\\"gpt-4o\\",\\"promptTokens\\":100,\\"completionTokens\\":50,\\"totalTokens\\":150,\\"costUSD\\":0.00125,\\"latencyMs\\":450,\\"userId\\":\\"alice\\"}\\'')"><i class="ti ti-copy"></i></button>
        </div>
      </div>

      <div class="cd" style="margin-bottom:12px">
        <div class="ch"><div class="ct">Editor slash commands</div></div>
        <p style="font-size:12px;color:var(--mu);margin-bottom:14px;line-height:1.8">After connecting via MCP, type these in Claude Code, Cursor, Antigravity, or Codex:</p>
        <table>
          <thead><tr><th>Command</th><th>What it does</th></tr></thead>
          <tbody>
            <tr><td><code>/guard</code></td><td>Cost summary — spend, budgets, alerts</td></tr>
            <tr><td><code>/guard_dashboard</code></td><td>Open this dashboard in browser</td></tr>
            <tr><td><code>/guard_limit</code></td><td>Set a spend limit for a user or team</td></tr>
            <tr><td><code>/guard_top</code></td><td>Top spending users today</td></tr>
            <tr><td><code>/guard_ack</code></td><td>Clear all alerts</td></tr>
          </tbody>
        </table>

        <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 7px">MCP config (paste into your editor)</div>
        <div class="cmd" style="flex-direction:column">
          <span>{</span>
          <span>&nbsp; "mcpServers": {</span>
          <span>&nbsp;&nbsp;&nbsp; "llm-cost-guard": {</span>
          <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "command": "npx",</span>
          <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "args": ["llm-cost-guard", "mcp"]</span>
          <span>&nbsp;&nbsp;&nbsp; }</span>
          <span>&nbsp; }</span>
          <span>}</span>
          <button class="cp" style="align-self:flex-end" onclick="copy(JSON.stringify({mcpServers:{'llm-cost-guard':{command:'npx',args:['llm-cost-guard','mcp']}}},null,2))"><i class="ti ti-copy"></i></button>
        </div>
        <p style="font-size:11px;color:var(--mu);margin-top:8px;line-height:1.7">Works in: Claude Code · Cursor · Antigravity · Codex · Windsurf · VS Code</p>
      </div>

      <div class="cd">
        <div class="ch"><div class="ct">Server info</div></div>
        <p style="font-size:12px;color:var(--mu);line-height:1.8">Running at <code>http://localhost:${port}</code><br>
        Start with: <code>npx llm-cost-guard start</code><br>
        All data is stored in memory — restarting the server clears it.</p>
      </div>
    </div>

  </div>
</div>
</div>

<!-- Add budget modal -->
<div class="mb" id="modal">
  <div class="mo">
    <div class="mt">Add budget limit</div>
    <div class="fl"><label>Scope</label>
      <select id="msc" onchange="upsc()">
        <option value="user">Per user</option>
        <option value="team">Per team</option>
        <option value="global">Global (all users)</option>
      </select>
    </div>
    <div class="fl" id="midw">
      <label id="midl">User ID</label>
      <input id="mid" placeholder="e.g. alice">
    </div>
    <div class="fl"><label>Limit (USD)</label>
      <input id="mlim" type="number" placeholder="e.g. 5.00" min="0.01" step="0.01">
    </div>
    <div class="fl"><label>Window</label>
      <select id="mwin">
        <option value="24">Daily (24 h)</option>
        <option value="168">Weekly (168 h)</option>
        <option value="720">Monthly (720 h)</option>
      </select>
    </div>
    <div class="fl">
      <div class="tgr">
        <div>
          <div style="font-size:13px;font-weight:500">Hard block when exceeded</div>
          <div style="font-size:11px;color:var(--mu);margin-top:2px">Off = alert only, no blocking</div>
        </div>
        <label class="tgl"><input type="checkbox" id="mhb" checked><span class="tsl"></span></label>
      </div>
    </div>
    <div class="ma">
      <button class="btn pr" style="flex:1" onclick="saveB()"><i class="ti ti-check"></i> Save limit</button>
      <button class="btn" onclick="closeM()">Cancel</button>
    </div>
  </div>
</div>

<script>
const PORT = ${port};
const API  = 'http://localhost:' + PORT;
let D = null, calls = [], CI = null, CM = 'cost';
const PC = {openai:'#10a37f', anthropic:'#d19a66', gemini:'#4285f4'};
const BC = {openai:'bo', anthropic:'ba', gemini:'bgg'};
const TITLES = {overview:'Overview', calls:'Call log', alerts:'Alerts', budgets:'Budgets', setup:'Setup'};

// ── Data loading ──────────────────────────────────────────────────────────────

async function load() {
  try {
    [D, calls] = await Promise.all([
      fetch(API + '/api/stats').then(r => r.json()),
      fetch(API + '/api/calls?limit=200').then(r => r.json()),
    ]);
    document.getElementById('lupd').textContent = 'Updated ' + new Date().toLocaleTimeString();
    document.getElementById('dot').style.background = 'var(--gn)';
    renderAll();
  } catch(e) {
    document.getElementById('lupd').textContent = 'Cannot connect to server';
    document.getElementById('dot').style.background = 'var(--rd)';
  }
}

// SSE live updates
(function connectSSE() {
  const es = new EventSource(API + '/stream');
  es.onmessage = e => {
    D = JSON.parse(e.data);
    document.getElementById('lupd').textContent = new Date().toLocaleTimeString();
    document.getElementById('dot').style.background = 'var(--gn)';
    renderAll();
  };
  es.onerror = () => {
    document.getElementById('dot').style.background = 'var(--am)';
    setTimeout(connectSSE, 3000);
  };
})();

// ── Render ────────────────────────────────────────────────────────────────────

function fmt(n) { return '$' + (n < 0.01 ? n.toFixed(6) : n.toFixed(4)); }
function rel(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  return s < 60 ? s + 's ago' : s < 3600 ? Math.floor(s / 60) + 'm ago' : Math.floor(s / 3600) + 'h ago';
}

function renderAll() {
  const pg = document.querySelector('.pg.on');
  if (!pg) return;
  const id = pg.id.replace('pg-', '');
  if (id === 'overview') renderOv();
  if (id === 'calls')    renderCalls();
  if (id === 'alerts')   renderAlerts();
  if (id === 'budgets')  renderBudgets();
  updBadge();
}

function renderOv() {
  if (!D) return;
  document.getElementById('s-today').textContent = fmt(D.costToday);
  document.getElementById('s-week').textContent  = fmt(D.costWeek);
  document.getElementById('s-users').textContent = D.activeUsers;
  document.getElementById('s-calls').textContent = D.callsToday + ' calls';
  document.getElementById('s-alc').textContent   = D.alerts.length;

  const maxC = Math.max(...Object.values(D.byProvider).map(p => p.costUSD), 0.0001);
  document.getElementById('provs').innerHTML =
    Object.entries(D.byProvider).sort((a,b) => b[1].costUSD - a[1].costUSD)
    .map(([p,d]) =>
      '<div class="pr-row">' +
        '<div class="pm"><span><span class="bg ' + (BC[p]||'') + '">' + p + '</span></span>' +
        '<span style="color:var(--mu)">' + fmt(d.costUSD) + ' · ' + d.calls + ' calls</span></div>' +
        '<div class="pbt"><div class="pbf" style="width:' + (d.costUSD/maxC*100).toFixed(1) + '%;background:' + (PC[p]||'#7c6af7') + '"></div></div>' +
      '</div>'
    ).join('') || '<div class="empty"><i class="ti ti-plug"></i><p>No calls yet.<br>Patch your OpenAI or Anthropic client.</p></div>';

  document.getElementById('tub').innerHTML =
    (D.topUsers||[]).map(u =>
      '<tr><td style="font-family:monospace;font-size:11px">' + u.userId + '</td>' +
      '<td>' + u.calls + '</td>' +
      '<td style="font-weight:600">' + fmt(u.costUSD) + '</td></tr>'
    ).join('') || '<tr><td colspan="3"><div class="empty"><i class="ti ti-users"></i><p>No calls yet</p></div></td></tr>';

  document.getElementById('oval').innerHTML =
    (D.alerts||[]).slice(0,3).map(alertHtml).join('') ||
    '<div class="empty"><i class="ti ti-bell-off"></i><p>No alerts</p></div>';

  renderChart();
}

function alertHtml(a) {
  return '<div class="ai ' + (a.severity === 'critical' ? 'cr2' : 'wr') + '">' +
    '<i class="ti ' + (a.severity === 'critical' ? 'ti-alert-triangle' : 'ti-alert-circle') + ' aic"></i>' +
    '<div style="flex:1"><div class="am2">' + a.message + '</div>' +
    '<div class="at">' + rel(a.ts) + ' · ' + a.type.replace(/_/g,' ') + '</div></div>' +
    '<button class="ab" onclick="ack(\'' + a.id + '\')"><i class="ti ti-x"></i></button>' +
    '</div>';
}

function renderAlerts() {
  if (!D) return;
  const al = D.alerts || [];
  document.getElementById('aabtn').style.display = al.length ? 'flex' : 'none';
  document.getElementById('alist').innerHTML = al.map(alertHtml).join('') ||
    '<div class="empty"><i class="ti ti-bell-off"></i><p>No alerts — all clear ✅</p></div>';
}

function renderCalls() {
  const uf = (document.getElementById('uf').value || '').toLowerCase();
  const pf = document.getElementById('pf').value;
  let r = calls;
  if (uf) r = r.filter(c => c.userId && c.userId.toLowerCase().includes(uf));
  if (pf) r = r.filter(c => c.provider === pf);
  document.getElementById('cb').innerHTML = r.slice(0, 200).map(c =>
    '<tr>' +
    '<td style="font-size:10px;color:var(--mu)">' + new Date(c.ts).toLocaleTimeString() + '</td>' +
    '<td style="font-family:monospace;font-size:11px">' + (c.userId || '—') + '</td>' +
    '<td><span class="bg ' + (BC[c.provider]||'') + '">' + c.provider + '</span></td>' +
    '<td style="font-size:11px;color:var(--mu)">' + c.model + '</td>' +
    '<td>' + (c.totalTokens||0).toLocaleString() + '</td>' +
    '<td style="font-weight:600">' + fmt(c.costUSD||0) + '</td>' +
    '<td style="color:var(--mu)">' + (c.latencyMs||0) + 'ms</td>' +
    '</tr>'
  ).join('') || '<tr><td colspan="7"><div class="empty"><i class="ti ti-database"></i><p>No calls yet</p></div></td></tr>';
}

function renderBudgets() {
  if (!D) return;
  document.getElementById('blist').innerHTML = (D.budgets||[]).map(b => {
    const cls = b.pct >= 100 ? 'fo' : b.pct >= 80 ? 'fw' : 'fs';
    return '<div class="bui">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<span style="font-size:13px;font-weight:600">' + (b.scope==='global'?'Global':b.scopeId) +
        ' <span style="font-size:10px;color:var(--mu);font-weight:400">' + b.scope + '</span></span>' +
        '<div style="display:flex;gap:5px;align-items:center">' +
          (b.hardBlock ? '<span class="hc">hard block</span>' : '<span class="sc2">alert only</span>') +
          '<button class="btn dr" style="padding:3px 8px;font-size:11px" onclick="delB(\'' + b.id + '\')"><i class="ti ti-trash"></i></button>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--mu)">' +
        '<span>' + fmt(b.spentUSD) + ' of ' + fmt(b.limitUSD) + '</span>' +
        '<span>' + b.pct.toFixed(1) + '%</span>' +
      '</div>' +
      '<div class="bbt"><div class="bbf ' + cls + '" style="width:' + b.pct.toFixed(1) + '%"></div></div>' +
      '<div style="font-size:10px;color:var(--mu)">' + b.windowHours + 'h window · ' + fmt(b.limitUSD - b.spentUSD) + ' remaining</div>' +
      '</div>';
  }).join('') || '<div class="empty" style="padding:50px"><i class="ti ti-wallet"></i><p>No limits set.<br>Click "Add limit" to protect your budget.</p></div>';
}

function renderChart() {
  if (!D) return;
  const labels = D.byHour.map(h => h.hour);
  const data   = D.byHour.map(h => CM === 'cost' ? +h.costUSD.toFixed(6) : h.calls);
  if (CI) {
    CI.data.labels = labels;
    CI.data.datasets[0].data = data;
    CI.update('none');
    return;
  }
  CI = new Chart(document.getElementById('chart').getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ data,
      backgroundColor: 'rgba(124,106,247,0.5)',
      borderColor: 'rgba(124,106,247,0.9)',
      borderWidth: 1, borderRadius: 3 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: c => CM === 'cost' ? '$' + c.raw.toFixed(6) : c.raw + ' calls' } } },
      scales: {
        x: { ticks: { color: '#6b6b80', font: { size: 10 }, maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,.04)' } },
        y: { ticks: { color: '#6b6b80', font: { size: 10 }, callback: v => CM === 'cost' ? '$' + v.toFixed(4) : v }, grid: { color: 'rgba(255,255,255,.06)' } },
      },
    },
  });
}

function setMode(m, el) {
  CM = m;
  document.querySelectorAll('.tb').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  renderChart();
}

function updBadge() {
  const n = (D?.alerts||[]).length;
  const el = document.getElementById('abadge');
  el.textContent = n;
  el.style.display = n ? 'inline' : 'none';
}

// ── Navigation ────────────────────────────────────────────────────────────────

function nav(p) {
  document.querySelectorAll('.ni').forEach(e => e.classList.toggle('on', e.dataset.p === p));
  document.querySelectorAll('.pg').forEach(e => e.classList.toggle('on', e.id === 'pg-' + p));
  document.getElementById('ptitle').textContent = TITLES[p] || p;
  renderAll();
  if (p === 'calls' && calls.length === 0) {
    fetch(API + '/api/calls?limit=200').then(r => r.json()).then(d => { calls = d; renderCalls(); });
  }
}
document.querySelectorAll('.ni').forEach(el => el.addEventListener('click', () => nav(el.dataset.p)));

// ── Modal ─────────────────────────────────────────────────────────────────────

function openM()  { document.getElementById('modal').classList.add('op'); }
function closeM() { document.getElementById('modal').classList.remove('op'); }
document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeM(); });

function upsc() {
  const s = document.getElementById('msc').value;
  document.getElementById('midw').style.display = s === 'global' ? 'none' : 'block';
  document.getElementById('midl').textContent = s === 'user' ? 'User ID' : 'Team ID';
  document.getElementById('mid').placeholder = s === 'user' ? 'e.g. alice' : 'e.g. team_eng';
}

async function saveB() {
  const scope = document.getElementById('msc').value;
  const scopeId = scope === 'global' ? 'global' : document.getElementById('mid').value.trim();
  const limitUSD = parseFloat(document.getElementById('mlim').value);
  const windowHours = parseInt(document.getElementById('mwin').value);
  const hardBlock = document.getElementById('mhb').checked;
  if (!scopeId || isNaN(limitUSD) || limitUSD <= 0) { alert('Please fill in all fields.'); return; }
  await fetch(API + '/api/budgets', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, scopeId, limitUSD, windowHours, hardBlock }),
  });
  closeM();
  load();
}

async function delB(id) {
  await fetch(API + '/api/budgets/' + id, { method: 'DELETE' });
  load();
}

async function ack(id) {
  await fetch(API + '/api/alerts/ack', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  load();
}

async function ackAll() {
  await fetch(API + '/api/alerts/ack', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true }),
  });
  load();
}

function copy(t) { navigator.clipboard.writeText(t).catch(() => {}); }

// ── Boot ──────────────────────────────────────────────────────────────────────
load();
</script>
</body>
</html>`;
}

module.exports = { getDashboardHTML };
