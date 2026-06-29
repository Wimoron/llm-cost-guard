# llm-cost-guard 🛡️

Track LLM costs, set spending limits, and get alerts — in your terminal, browser, or AI editor.

**One command to install. One line to start tracking.**

---

## Install

```bash
npm install llm-cost-guard
```

That's it. No config files. No API keys. Works immediately.

---

## Start the dashboard

```bash
npx llm-cost-guard start
```

Opens a live dashboard at **http://localhost:47821** in your browser.

---

## Track your LLM calls

Add one line to your app:

**OpenAI:**
```js
import { patch } from 'llm-cost-guard';
import OpenAI from 'openai';

const openai = patch(new OpenAI());

// Use openai exactly as before — every call is tracked automatically
const res = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

**Anthropic:**
```js
import { patch } from 'llm-cost-guard';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = patch(new Anthropic());

const msg = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

**Any language (HTTP):**
```bash
curl -X POST http://localhost:47821/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "model": "gpt-4o",
    "promptTokens": 100,
    "completionTokens": 50,
    "totalTokens": 150,
    "costUSD": 0.00125,
    "latencyMs": 450,
    "userId": "alice"
  }'
```

---

## Set spending limits

From code:
```js
import { addBudget } from 'llm-cost-guard';

// Block calls when alice spends more than $2/day
addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 2.00, windowHours: 24, hardBlock: true });

// Alert (but don't block) when team spends over $50/day
addBudget({ scope: 'team', scopeId: 'eng', limitUSD: 50.00, windowHours: 24, hardBlock: false });

// Global $200/day soft cap
addBudget({ scope: 'global', scopeId: 'global', limitUSD: 200.00, windowHours: 24, hardBlock: false });
```

Or add them visually in the **Budgets** tab of the dashboard.

When a hard limit is hit, the patched client throws:
```
Error: [llm-cost-guard] Budget exceeded for user "alice": $2.0041 of $2.00
  code: 'BUDGET_EXCEEDED'
```

Catch it like any error:
```js
try {
  const res = await openai.chat.completions.create({ ... });
} catch (err) {
  if (err.code === 'BUDGET_EXCEEDED') {
    return res.status(429).json({ error: 'Daily limit reached. Try again tomorrow.' });
  }
  throw err;
}
```

---

## Use in Claude Code, Cursor, Antigravity, Codex

**Step 1 — Connect your editor:**
```bash
npx llm-cost-guard setup
```

This auto-detects installed editors and writes the MCP config for each one.

**Step 2 — Restart your editor.**

**Step 3 — Type `/guard` in chat.**

### Available slash commands

| Command | What it does |
|---|---|
| `/guard` | Cost summary — spend today, budgets, active alerts |
| `/guard_dashboard` | Open the live dashboard in your browser |
| `/guard_limit` | Set a spending limit for a user or team |
| `/guard_top` | Show top spending users today |
| `/guard_ack` | Clear all alerts |

### Manual MCP config (if auto-setup doesn't find your editor)

Add this to your editor's MCP config file:

```json
{
  "mcpServers": {
    "llm-cost-guard": {
      "command": "npx",
      "args": ["llm-cost-guard", "mcp"]
    }
  }
}
```

| Editor | Config file location |
|---|---|
| Claude Code | `~/.claude/claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp.json` |
| Antigravity | `~/.gemini/antigravity/mcp_config.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Codex | `~/.codex/config.toml` (TOML format, see below) |
| VS Code | `.vscode/mcp.json` |

**Codex config.toml format:**
```toml
[mcp_servers.llm-cost-guard]
command = "npx"
args    = ["llm-cost-guard", "mcp"]
```

---

## Dashboard

Open at **http://localhost:47821** or run `npx llm-cost-guard start`.

| Tab | What you see |
|---|---|
| **Overview** | Spend today/week, hourly chart, provider split, top users |
| **Call log** | Every API call — model, tokens, cost, latency, user |
| **Alerts** | Budget warnings (80%, 100%), cost spikes |
| **Budgets** | Add/remove limits with live progress bars |
| **Setup** | Copy-paste snippets for any language or editor |

---

## Supported providers & models

| Provider | Auto-patched | Models |
|---|---|---|
| OpenAI | ✅ `patch(new OpenAI())` | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo, o1, o3-mini |
| Anthropic | ✅ `patch(new Anthropic())` | claude-opus-4, claude-sonnet-4, claude-haiku-4, claude-3.5-* |
| Gemini | HTTP API | gemini-1.5-pro/flash, gemini-2.0-flash |

Unknown models fall back to a conservative price estimate.

---

## CLI commands

```bash
npx llm-cost-guard start    # Start dashboard (opens browser automatically)
npx llm-cost-guard setup    # Auto-connect to all detected editors
npx llm-cost-guard status   # Check if server is running
npx llm-cost-guard mcp      # Start MCP mode (used by editors internally)
```

---

## Run tests

```bash
npm test
```

---

## API reference

```js
import {
  patch,          // patch(client, userId?) — wraps OpenAI or Anthropic
  patchOpenAI,    // explicit OpenAI patch
  patchAnthropic, // explicit Anthropic patch

  addCall,        // manually record a call
  calcCost,       // calcCost(provider, model, promptTokens, completionTokens)

  addBudget,      // addBudget({ scope, scopeId, limitUSD, windowHours, hardBlock })
  removeBudget,   // removeBudget(id)
  checkBudget,    // checkBudget(userId) → { blocked, reason }

  getStats,       // get dashboard stats snapshot
  getCalls,       // getCalls(limit, userId)
  ackAlert,       // ackAlert(id) or ackAlert('__all__')

  startServer,    // start the HTTP server programmatically
} from 'llm-cost-guard';
```

---

## Requirements

- Node.js 18+
- No other dependencies for core tracking
- `@modelcontextprotocol/sdk` and `zod` for MCP slash commands (included)

---

## License

MIT
