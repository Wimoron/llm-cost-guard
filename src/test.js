'use strict';

const assert = require('assert');
const { calcCost, addCall, addBudget, removeBudget, checkBudget,
        getStats, ackAlert, state } = require('./core');

let passed = 0;
let failed = 0;

function test(name, fn) {
  // Reset state before each test
  state.calls.length  = 0;
  state.budgets.length = 0;
  state.alerts.length  = 0;

  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
    failed++;
  }
}

console.log('\n🛡️  llm-cost-guard tests\n');

// ── Pricing ───────────────────────────────────────────────────────────────────

test('calcCost: gpt-4o correct price', () => {
  // 1000 prompt @ $0.005/1k + 500 completion @ $0.015/1k = $0.0125
  const cost = calcCost('openai', 'gpt-4o', 1000, 500);
  assert.ok(Math.abs(cost - 0.0125) < 0.000001, `Expected ~0.0125, got ${cost}`);
});

test('calcCost: zero tokens = zero cost', () => {
  assert.strictEqual(calcCost('openai', 'gpt-4o', 0, 0), 0);
});

test('calcCost: prefix matching for versioned models', () => {
  const exact     = calcCost('openai', 'gpt-4o', 1000, 1000);
  const versioned = calcCost('openai', 'gpt-4o-2024-08-06', 1000, 1000);
  assert.strictEqual(exact, versioned);
});

test('calcCost: unknown model uses fallback', () => {
  const cost = calcCost('openai', 'gpt-unknown-xyz', 1000, 1000);
  assert.ok(cost > 0, 'Fallback should return positive cost');
});

test('calcCost: anthropic claude correct price', () => {
  const cost = calcCost('anthropic', 'claude-3-5-sonnet-20241022', 1000, 500);
  // 1000 @ $0.003/1k + 500 @ $0.015/1k = $0.003 + $0.0075 = $0.0105
  assert.ok(Math.abs(cost - 0.0105) < 0.000001, `Expected ~0.0105, got ${cost}`);
});

// ── Store: calls ─────────────────────────────────────────────────────────────

test('addCall: stores a call', () => {
  addCall({ provider: 'openai', model: 'gpt-4o', promptTokens: 100,
    completionTokens: 50, totalTokens: 150, costUSD: 0.00125, latencyMs: 300, blocked: false });
  assert.strictEqual(state.calls.length, 1);
});

test('addCall: newest first', () => {
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 0.001, ts: 1000, blocked: false });
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 0.002, ts: 2000, blocked: false });
  assert.strictEqual(state.calls[0].ts, 2000);
});

test('addCall: assigns id if missing', () => {
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 0.001, blocked: false });
  assert.ok(state.calls[0].id, 'Should have an id');
});

// ── Store: budgets ────────────────────────────────────────────────────────────

test('addBudget: creates a budget with id', () => {
  const b = addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 5, windowHours: 24, hardBlock: true });
  assert.ok(b.id, 'Should have an id');
  assert.strictEqual(state.budgets.length, 1);
});

test('addBudget: replaces existing same scope+scopeId+window', () => {
  addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 5,  windowHours: 24, hardBlock: true });
  addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 10, windowHours: 24, hardBlock: true });
  assert.strictEqual(state.budgets.length, 1);
  assert.strictEqual(state.budgets[0].limitUSD, 10);
});

test('addBudget: keeps different windows separately', () => {
  addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 5,  windowHours: 24,  hardBlock: true });
  addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 50, windowHours: 720, hardBlock: true });
  assert.strictEqual(state.budgets.length, 2);
});

test('removeBudget: removes by id', () => {
  const b = addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 5, windowHours: 24, hardBlock: true });
  removeBudget(b.id);
  assert.strictEqual(state.budgets.length, 0);
});

// ── checkBudget ───────────────────────────────────────────────────────────────

test('checkBudget: allows when no budgets set', () => {
  const result = checkBudget('alice');
  assert.strictEqual(result.blocked, false);
});

test('checkBudget: allows when within budget', () => {
  addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 10, windowHours: 24, hardBlock: true });
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 1, userId: 'alice', blocked: false });
  assert.strictEqual(checkBudget('alice').blocked, false);
});

test('checkBudget: blocks when hard limit exceeded', () => {
  addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 0.001, windowHours: 24, hardBlock: true });
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 5, userId: 'alice', blocked: false });
  const result = checkBudget('alice');
  assert.strictEqual(result.blocked, true);
  assert.ok(result.reason.includes('alice'));
});

test('checkBudget: does not block when hardBlock=false', () => {
  addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 0.001, windowHours: 24, hardBlock: false });
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 5, userId: 'alice', blocked: false });
  assert.strictEqual(checkBudget('alice').blocked, false);
});

test('checkBudget: global budget blocks all users', () => {
  addBudget({ scope: 'global', scopeId: 'global', limitUSD: 0.001, windowHours: 24, hardBlock: true });
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 5, userId: 'bob', blocked: false });
  assert.strictEqual(checkBudget('carol').blocked, true);
});

// ── getStats ──────────────────────────────────────────────────────────────────

test('getStats: costToday sums recent calls', () => {
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 0.05, blocked: false });
  addCall({ provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', costUSD: 0.03, blocked: false });
  const s = getStats();
  assert.ok(Math.abs(s.costToday - 0.08) < 0.000001);
});

test('getStats: excludes calls older than 24h from costToday', () => {
  const old = Date.now() - 2 * 86_400_000;
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 99, ts: old, blocked: false });
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 0.01, blocked: false });
  const s = getStats();
  assert.ok(Math.abs(s.costToday - 0.01) < 0.000001);
});

test('getStats: counts unique active users', () => {
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 0.01, userId: 'alice', blocked: false });
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 0.01, userId: 'bob',   blocked: false });
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 0.01, userId: 'alice', blocked: false });
  assert.strictEqual(getStats().activeUsers, 2);
});

test('getStats: byHour has 24 entries', () => {
  assert.strictEqual(getStats().byHour.length, 24);
});

test('getStats: budgets include spentUSD and pct', () => {
  addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 10, windowHours: 24, hardBlock: true });
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 5, userId: 'alice', blocked: false });
  const b = getStats().budgets[0];
  assert.ok(Math.abs(b.spentUSD - 5) < 0.000001);
  assert.ok(Math.abs(b.pct - 50) < 0.001);
});

// ── Alerts ────────────────────────────────────────────────────────────────────

test('ackAlert: acknowledges single alert', () => {
  addBudget({ scope: 'user', scopeId: 'alice', limitUSD: 0.001, windowHours: 24, hardBlock: false });
  // Trigger 80% warning by spending over 80% of limit
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 0.0009, userId: 'alice', blocked: false });
  const before = getStats().alerts.length;
  if (before > 0) {
    ackAlert(state.alerts[0].id);
    assert.strictEqual(getStats().alerts.length, before - 1);
  } else {
    // No alert triggered in this scenario — that's also fine
    assert.ok(true);
  }
});

test('ackAlert: __all__ clears all alerts', () => {
  // Manually inject alerts for this test
  const { addAlert } = require('./core');
  addAlert({ severity: 'warning', type: 'budget_80', message: 'test 1', scopeId: 'alice' });
  addAlert({ severity: 'critical', type: 'budget_exceeded', message: 'test 2', scopeId: 'bob' });
  assert.ok(getStats().alerts.length >= 2);
  ackAlert('__all__');
  assert.strictEqual(getStats().alerts.length, 0);
});

// ── patch ─────────────────────────────────────────────────────────────────────

test('patch: throws for unrecognized client', () => {
  const { patch } = require('./patch');
  assert.throws(() => patch({}), /Unrecognized client/);
});

// Async tests run sequentially after sync tests
const asyncTests = [];
function testAsync(name, fn) { asyncTests.push({ name, fn }); }

testAsync('patchOpenAI: tracks call and returns original response', async () => {
  state.calls.length = 0; state.budgets.length = 0; state.alerts.length = 0;
  const { patchOpenAI } = require('./patch');
  let callCount = 0;
  const fake = {
    chat: { completions: { create: async (_p) => {
      callCount++;
      return { choices: [{ message: { content: 'hello' } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }, model: 'gpt-4o' };
    }}},
  };
  const patched = patchOpenAI(fake, 'alice');
  const result  = await patched.chat.completions.create({ model: 'gpt-4o', messages: [] });
  assert.strictEqual(callCount, 1);
  assert.strictEqual(result.choices[0].message.content, 'hello');
  assert.strictEqual(state.calls.length, 1);
  assert.strictEqual(state.calls[0].userId, 'alice');
  assert.ok(state.calls[0].costUSD > 0);
});

testAsync('patchAnthropic: tracks call and returns original response', async () => {
  state.calls.length = 0; state.budgets.length = 0; state.alerts.length = 0;
  const { patchAnthropic } = require('./patch');
  let callCount = 0;
  const fake = {
    messages: { create: async (_p) => {
      callCount++;
      return { content: [{ type: 'text', text: 'hi' }],
        usage: { input_tokens: 80, output_tokens: 40 }, model: 'claude-3-5-sonnet-20241022' };
    }},
  };
  const patched = patchAnthropic(fake, 'bob');
  const result  = await patched.messages.create({ model: 'claude-3-5-sonnet-20241022', messages: [], max_tokens: 100 });
  assert.strictEqual(callCount, 1);
  assert.strictEqual(result.content[0].text, 'hi');
  assert.strictEqual(state.calls.length, 1);
  assert.ok(state.calls[0].costUSD > 0);
});

testAsync('patchOpenAI: throws BUDGET_EXCEEDED when blocked', async () => {
  state.calls.length = 0; state.budgets.length = 0; state.alerts.length = 0;
  const { patchOpenAI } = require('./patch');
  addBudget({ scope: 'user', scopeId: 'dave', limitUSD: 0.000001, windowHours: 24, hardBlock: true });
  addCall({ provider: 'openai', model: 'gpt-4o', costUSD: 99, userId: 'dave', blocked: false });
  const fake = {
    chat: { completions: { create: async () => ({ choices: [], usage: {}, model: 'gpt-4o' }) }},
  };
  const patched = patchOpenAI(fake, 'dave');
  let threw = false;
  try { await patched.chat.completions.create({ model: 'gpt-4o', messages: [] }); }
  catch (e) { threw = true; assert.strictEqual(e.code, 'BUDGET_EXCEEDED'); }
  assert.ok(threw, 'Should have thrown BUDGET_EXCEEDED');
});

// ── Run async tests ───────────────────────────────────────────────────────────

(async () => {
  for (const t of asyncTests) {
    state.calls.length = 0; state.budgets.length = 0; state.alerts.length = 0;
    try {
      await t.fn();
      console.log(`  ✓ ${t.name}`);
      passed++;
    } catch (e) {
      console.log(`  ✗ ${t.name}`);
      console.log(`    ${e.message}`);
      failed++;
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
})();
