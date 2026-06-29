'use strict';

const { getStats, addBudget, removeBudget, ackAlert, getCalls } = require('./core');
const { PORT } = require('./server');

async function startMCP() {
  // Lazy-load MCP SDK so the package still works without it being installed
  let McpServer, StdioServerTransport, z;
  try {
    ({ McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js'));
    ({ StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js'));
    ({ z } = require('zod'));
  } catch (e) {
    process.stderr.write('[llm-cost-guard] MCP SDK not found. Run: npm install\n');
    process.exit(1);
  }

  const mcp = new McpServer({ name: 'llm-cost-guard', version: '1.0.0' });
  const fmt = n => `$${n < 0.01 ? n.toFixed(6) : n.toFixed(4)}`;

  // /guard — status summary
  mcp.tool('guard', 'Show LLM cost summary: spend today, active budgets, alerts.', {}, async () => {
    const s = getStats();
    const lines = [
      `🛡️  llm-cost-guard`,
      ``,
      `  Today    ${fmt(s.costToday)}  (${s.callsToday} calls, ${s.activeUsers} active users)`,
      `  Week     ${fmt(s.costWeek)}`,
      ``,
    ];

    if (Object.keys(s.byProvider).length) {
      lines.push('  By provider:');
      for (const [p, d] of Object.entries(s.byProvider)) {
        lines.push(`    ${p.padEnd(12)} ${fmt(d.costUSD).padStart(10)}  (${d.calls} calls)`);
      }
      lines.push('');
    }

    if (s.budgets.length) {
      lines.push('  Budgets:');
      for (const b of s.budgets) {
        const bar = '█'.repeat(Math.round(b.pct / 10)) + '░'.repeat(10 - Math.round(b.pct / 10));
        const status = b.pct >= 100 ? ' ⛔ EXCEEDED' : b.pct >= 80 ? ' ⚠️  WARNING' : '';
        lines.push(`    ${b.scope} "${b.scopeId}"  [${bar}] ${b.pct.toFixed(0)}%${status}`);
        lines.push(`    ${fmt(b.spentUSD)} spent of ${fmt(b.limitUSD)}  (${b.windowHours}h window)`);
      }
      lines.push('');
    }

    const unacked = s.alerts;
    if (unacked.length) {
      lines.push(`  ⚠️  ${unacked.length} alert(s):`);
      for (const a of unacked.slice(0, 3)) {
        lines.push(`    [${a.severity.toUpperCase()}] ${a.message}`);
      }
    } else {
      lines.push('  ✅ No active alerts');
    }

    lines.push('');
    lines.push(`  Dashboard → http://localhost:${PORT}`);

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  });

  // /guard_dashboard — open browser
  mcp.tool('guard_dashboard', 'Open the live cost dashboard in your browser.', {}, async () => {
    const url = `http://localhost:${PORT}`;
    const { exec } = require('child_process');
    const cmd = process.platform === 'darwin' ? `open "${url}"` :
                process.platform === 'win32'   ? `start "" "${url}"` :
                `xdg-open "${url}"`;
    exec(cmd);
    return { content: [{ type: 'text', text: `🛡️  Dashboard opened: ${url}` }] };
  });

  // /guard_limit — set a budget
  mcp.tool(
    'guard_limit',
    'Set a spend limit. Example: scope=user, scopeId=alice, limitUSD=2',
    {
      scope:       z.enum(['user', 'team', 'global']).describe('Scope: user | team | global'),
      scopeId:     z.string().optional().describe('User or team ID (leave empty for global)'),
      limitUSD:    z.number().positive().describe('Max spend in USD'),
      windowHours: z.number().optional().default(24).describe('Rolling window hours (default 24)'),
      hardBlock:   z.boolean().optional().default(true).describe('Block calls when exceeded?'),
    },
    async ({ scope, scopeId, limitUSD, windowHours, hardBlock }) => {
      const id = scope === 'global' ? 'global' : (scopeId || 'unknown');
      const b  = addBudget({ scope, scopeId: id, limitUSD,
        windowHours: windowHours || 24, hardBlock: hardBlock !== false });
      const win = { 24: 'daily', 168: 'weekly', 720: 'monthly' }[windowHours] || `${windowHours}h`;
      return {
        content: [{
          type: 'text',
          text: `✅ Budget set\n\n  ${scope} "${id}" → ${fmt(limitUSD)} ${win} ${b.hardBlock ? '(hard block)' : '(alert only)'}\n  ID: ${b.id}`,
        }],
      };
    }
  );

  // /guard_top — top users
  mcp.tool('guard_top', 'Show top spending users today.', {}, async () => {
    const s = getStats();
    if (!s.topUsers.length) return { content: [{ type: 'text', text: 'No calls recorded yet.' }] };
    const rows = s.topUsers.map((u, i) =>
      `  ${String(i + 1).padStart(2)}. ${u.userId.padEnd(20)} ${fmt(u.costUSD).padStart(10)}  (${u.calls} calls)`
    );
    return { content: [{ type: 'text', text: `Top users today:\n\n${rows.join('\n')}` }] };
  });

  // /guard_ack — acknowledge alerts
  mcp.tool('guard_ack', 'Acknowledge and clear all alerts.', {}, async () => {
    ackAlert('__all__');
    return { content: [{ type: 'text', text: '✅ All alerts cleared.' }] };
  });

  const transport = new StdioServerTransport();
  await mcp.connect(transport);
  process.stderr.write('[llm-cost-guard] MCP server ready\n');
}

module.exports = { startMCP };
