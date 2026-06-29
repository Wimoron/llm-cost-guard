'use strict';

const { randomUUID } = require('crypto');
const { calcCost, addCall, checkBudget } = require('./core');

// ── patch() — auto-detects OpenAI or Anthropic ───────────────────────────────

function patch(client, userId) {
  if (isOpenAI(client))    return patchOpenAI(client, userId);
  if (isAnthropic(client)) return patchAnthropic(client, userId);
  throw new Error('[llm-cost-guard] Unrecognized client. Supported: OpenAI, Anthropic.');
}

function isOpenAI(c)    { return c && c.chat && c.chat.completions && typeof c.chat.completions.create === 'function'; }
function isAnthropic(c) { return c && c.messages && typeof c.messages.create === 'function'; }

// ── OpenAI ────────────────────────────────────────────────────────────────────

function patchOpenAI(client, userId) {
  const original = client.chat.completions.create.bind(client.chat.completions);

  client.chat.completions.create = async function(params) {
    const { blocked, reason } = checkBudget(userId);
    if (blocked) {
      addCall({ provider: 'openai', model: params.model || 'unknown',
        promptTokens: 0, completionTokens: 0, totalTokens: 0,
        costUSD: 0, latencyMs: 0, userId, blocked: true, blockReason: reason });
      const err = new Error(`[llm-cost-guard] ${reason}`);
      err.code = 'BUDGET_EXCEEDED';
      throw err;
    }

    const t0 = Date.now();
    const raw = await original(params);
    const u = raw.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const model = raw.model || params.model || 'unknown';

    addCall({
      provider: 'openai', model,
      promptTokens: u.prompt_tokens,
      completionTokens: u.completion_tokens,
      totalTokens: u.total_tokens,
      costUSD: calcCost('openai', model, u.prompt_tokens, u.completion_tokens),
      latencyMs: Date.now() - t0,
      userId, blocked: false,
    });

    return raw;
  };

  return client;
}

// ── Anthropic ─────────────────────────────────────────────────────────────────

function patchAnthropic(client, userId) {
  const original = client.messages.create.bind(client.messages);

  client.messages.create = async function(params) {
    const { blocked, reason } = checkBudget(userId);
    if (blocked) {
      const err = new Error(`[llm-cost-guard] ${reason}`);
      err.code = 'BUDGET_EXCEEDED';
      throw err;
    }

    const t0 = Date.now();
    const raw = await original(params);
    const u = raw.usage || { input_tokens: 0, output_tokens: 0 };
    const model = raw.model || params.model || 'unknown';

    addCall({
      provider: 'anthropic', model,
      promptTokens: u.input_tokens,
      completionTokens: u.output_tokens,
      totalTokens: u.input_tokens + u.output_tokens,
      costUSD: calcCost('anthropic', model, u.input_tokens, u.output_tokens),
      latencyMs: Date.now() - t0,
      userId, blocked: false,
    });

    return raw;
  };

  return client;
}

module.exports = { patch, patchOpenAI, patchAnthropic };
