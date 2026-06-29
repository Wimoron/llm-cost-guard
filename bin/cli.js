#!/usr/bin/env node
'use strict';

const cmd = process.argv[2] || 'start';

switch (cmd) {

  // ── npx llm-cost-guard start ──────────────────────────────────────────────
  // Starts the HTTP dashboard server only (no MCP stdio)
  case 'start': {
    const { startServer } = require('../src/server');
    const server = startServer();

    // Try to open the dashboard in the browser
    const { exec } = require('child_process');
    setTimeout(() => {
      const port = process.env.LCG_PORT || 47821;
      const url  = `http://localhost:${port}`;
      const open = process.platform === 'darwin' ? `open "${url}"` :
                   process.platform === 'win32'   ? `start "" "${url}"` :
                   `xdg-open "${url}"`;
      exec(open, () => {});
    }, 500);

    // Graceful shutdown
    process.on('SIGINT',  () => { server.close(); process.exit(0); });
    process.on('SIGTERM', () => { server.close(); process.exit(0); });
    break;
  }

  // ── npx llm-cost-guard mcp ───────────────────────────────────────────────
  // Starts MCP stdio server + HTTP dashboard together
  // This is what editors call when they launch the MCP server
  case 'mcp': {
    // Start HTTP server silently in background (for dashboard)
    const { createServer } = require('../src/server');
    const port = parseInt(process.env.LCG_PORT || '47821');
    const http = createServer();
    http.on('error', () => {}); // silently ignore port conflicts in MCP mode
    http.listen(port, '127.0.0.1', () => {});

    // Start MCP over stdio (this takes over the process)
    const { startMCP } = require('../src/mcp');
    startMCP().catch(e => {
      process.stderr.write(`[llm-cost-guard] Fatal: ${e.message}\n`);
      process.exit(1);
    });
    break;
  }

  // ── npx llm-cost-guard status ────────────────────────────────────────────
  case 'status': {
    const http = require('http');
    const port = process.env.LCG_PORT || 47821;
    const req  = http.get(`http://localhost:${port}/api/stats`, res => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => {
        try {
          const s = JSON.parse(body);
          const fmt = n => '$' + (n < 0.01 ? n.toFixed(6) : n.toFixed(4));
          console.log(`\n🛡️  llm-cost-guard is running`);
          console.log(`   Today:  ${fmt(s.costToday)}  (${s.callsToday} calls)`);
          console.log(`   Week:   ${fmt(s.costWeek)}`);
          console.log(`   Alerts: ${s.alerts.length} unacknowledged`);
          console.log(`\n   Dashboard → http://localhost:${port}\n`);
        } catch (e) {
          console.error('Could not parse response');
        }
      });
    });
    req.on('error', () => {
      console.log(`\n❌  llm-cost-guard is not running on port ${port}`);
      console.log(`   Start it with: npx llm-cost-guard start\n`);
    });
    break;
  }

  // ── npx llm-cost-guard setup ─────────────────────────────────────────────
  // Auto-writes MCP config for detected editors
  case 'setup': {
    setup();
    break;
  }

  default: {
    console.log(`
🛡️  llm-cost-guard

Usage:
  npx llm-cost-guard start    Start the dashboard server
  npx llm-cost-guard mcp      Start MCP server (used by editors)
  npx llm-cost-guard setup    Auto-connect to Claude Code, Cursor, etc.
  npx llm-cost-guard status   Check if the server is running
`);
  }
}

// ── setup command ─────────────────────────────────────────────────────────────

function setup() {
  const fs   = require('fs');
  const path = require('path');
  const os   = require('os');
  const HOME = os.homedir();

  console.log('\n🛡️  llm-cost-guard setup\n');

  const entry = {
    command: 'npx',
    args: ['llm-cost-guard', 'mcp'],
    description: 'LLM cost tracker — type /guard in chat',
  };

  // JSON-based editors
  const jsonConfigs = [
    { name: 'Claude Code',  path: path.join(HOME, '.claude', 'claude_desktop_config.json') },
    { name: 'Cursor',       path: path.join(HOME, '.cursor', 'mcp.json') },
    { name: 'Antigravity',  path: path.join(HOME, '.gemini', 'antigravity', 'mcp_config.json') },
    { name: 'Windsurf',     path: path.join(HOME, '.codeium', 'windsurf', 'mcp_config.json') },
    { name: 'VS Code',      path: path.join(HOME, '.vscode', 'mcp.json') },
  ];

  let connected = 0;

  for (const cfg of jsonConfigs) {
    try {
      const dir = path.dirname(cfg.path);
      // Only write if the editor's folder already exists (i.e. it's installed)
      if (!fs.existsSync(dir)) continue;

      let existing = {};
      if (fs.existsSync(cfg.path)) {
        try { existing = JSON.parse(fs.readFileSync(cfg.path, 'utf8')); } catch (_) {}
      }
      existing.mcpServers = existing.mcpServers || {};
      existing.mcpServers['llm-cost-guard'] = entry;

      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(cfg.path, JSON.stringify(existing, null, 2));
      console.log(`  ✓ Connected to ${cfg.name}`);
      connected++;
    } catch (e) {
      console.log(`  ✗ Could not write ${cfg.name} config: ${e.message}`);
    }
  }

  // Codex — TOML format
  const codexDir  = path.join(HOME, '.codex');
  const codexPath = path.join(codexDir, 'config.toml');
  if (fs.existsSync(codexDir)) {
    try {
      let toml = fs.existsSync(codexPath) ? fs.readFileSync(codexPath, 'utf8') : '';
      if (!toml.includes('llm-cost-guard')) {
        toml += `\n[mcp_servers.llm-cost-guard]\ncommand = "npx"\nargs    = ["llm-cost-guard", "mcp"]\n`;
        fs.writeFileSync(codexPath, toml);
        console.log(`  ✓ Connected to Codex`);
        connected++;
      } else {
        console.log(`  ✓ Codex already connected`);
        connected++;
      }
    } catch (e) {
      console.log(`  ✗ Could not write Codex config: ${e.message}`);
    }
  }

  if (connected === 0) {
    console.log(`  No supported editors detected.\n`);
    console.log(`  Manual setup — add this to your editor's MCP config:`);
    console.log(`\n  ${JSON.stringify({ mcpServers: { 'llm-cost-guard': entry } }, null, 2)}\n`);
    console.log(`  Supported editors: Claude Code, Cursor, Antigravity, Codex, Windsurf, VS Code\n`);
  } else {
    console.log(`\n  ${connected} editor(s) connected.`);
    console.log(`  Restart your editor, then type /guard in chat.\n`);
  }
}
