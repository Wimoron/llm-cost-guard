'use strict';

// ── Pricing (USD per 1k tokens) ───────────────────────────────────────────────

const PRICING = {
  openai: {
    'gpt-4o':          [0.005,  0.015],
    'gpt-4o-mini':     [0.00015,0.0006],
    'gpt-4-turbo':     [0.01,   0.03],
    'gpt-4':           [0.03,   0.06],
    'gpt-3.5-turbo':   [0.0005, 0.0015],
    'o1':              [0.015,  0.06],
    'o1-mini':         [0.003,  0.012],
    'o3-mini':         [0.0011, 0.0044],
  },
  anthropic: {
    'claude-opus-4':              [0.015, 0.075],
    'claude-sonnet-4':            [0.003, 0.015],
    'claude-haiku-4':             [0.0008,0.004],
    'claude-3-5-sonnet-20241022': [0.003, 0.015],
    'claude-3-5-haiku-20241022':  [0.0008,0.004],
    'claude-3-opus-20240229':     [0.015, 0.075],
    'claude-3-haiku-20240307':    [0.00025,0.00125],
  },
  gemini: {
    'gemini-1.5-pro':   [0.00125,0.005],
    'gemini-1.5-flash': [0.000075,0.0003],
    'gemini-2.0-flash': [0.0001, 0.0004],
  },
};

function calcCost(provider, model, prompt, completion) {
  const table = PRICING[provider] || {};
  const key = Object.keys(table).find(k => model === k || model.startsWith(k));
  const [pp, cp] = key ? table[key] : [0.01, 0.03];
  return +((prompt / 1000) * pp + (completion / 1000) * cp).toFixed(8);
}

// ── In-memory store ───────────────────────────────────────────────────────────

const { randomUUID } = require('crypto');

const state = { calls: [], budgets: [], alerts: [] };
const listeners = new Set();

function notify() {
  listeners.forEach(fn => { try { fn(); } catch (_) {} });
}

function addCall(call) {
  state.calls.unshift({ ...call, id: call.id || randomUUID(), ts: call.ts || Date.now() });
  if (state.calls.length > 5000) state.calls.length = 5000;
  _checkBudgetAlerts(call);
  notify();
}

function addBudget(b) {
  // Replace if same scope+scopeId+windowHours exists
  state.budgets = state.budgets.filter(
    x => !(x.scope === b.scope && x.scopeId === b.scopeId && x.windowHours === b.windowHours)
  );
  const budget = { ...b, id: b.id || randomUUID() };
  state.budgets.push(budget);
  notify();
  return budget;
}

function removeBudget(id) {
  state.budgets = state.budgets.filter(b => b.id !== id);
  notify();
}

function addAlert(a) {
  const alert = { ...a, id: randomUUID(), ts: Date.now(), acked: false };
  state.alerts.unshift(alert);
  if (state.alerts.length > 200) state.alerts.length = 200;
  notify();
  return alert;
}

function ackAlert(id) {
  if (id === '__all__') state.alerts.forEach(a => (a.acked = true));
  else { const a = state.alerts.find(x => x.id === id); if (a) a.acked = true; }
  notify();
}

function checkBudget(userId) {
  const now = Date.now();
  for (const b of state.budgets) {
    if (b.scope === 'user' && b.scopeId !== userId) continue;
    const spent = _spentFor(b, now);
    if (spent >= b.limitUSD && b.hardBlock) {
      return {
        blocked: true,
        reason: `Budget exceeded for ${b.scope} "${b.scopeId}": $${spent.toFixed(4)} of $${b.limitUSD}`
      };
    }
  }
  return { blocked: false };
}

function _spentFor(b, now) {
  return state.calls
    .filter(c => now - c.ts <= b.windowHours * 3_600_000 &&
      (b.scope === 'global' || c.userId === b.scopeId))
    .reduce((s, c) => s + (c.costUSD || 0), 0);
}

function _checkBudgetAlerts(call) {
  const now = Date.now();
  for (const b of state.budgets) {
    if (b.scope === 'user' && b.scopeId !== call.userId) continue;
    const spent = _spentFor(b, now);
    const pct = (spent / b.limitUSD) * 100;
    const key80  = `warn_${b.id}`;
    const key100 = `over_${b.id}`;
    if (pct >= 80 && pct < 100 && !state.alerts.find(a => !a.acked && a._key === key80)) {
      const al = addAlert({ severity: 'warning', type: 'budget_80',
        message: `${b.scope} "${b.scopeId}" has used ${pct.toFixed(0)}% of $${b.limitUSD} budget`,
        scopeId: b.scopeId });
      al._key = key80;
    }
    if (pct >= 100 && !state.alerts.find(a => !a.acked && a._key === key100)) {
      const al = addAlert({ severity: 'critical', type: 'budget_exceeded',
        message: `Budget exceeded: ${b.scope} "${b.scopeId}" spent $${spent.toFixed(4)} of $${b.limitUSD}`,
        scopeId: b.scopeId });
      al._key = key100;
    }
  }
}

function getStats() {
  const now = Date.now();
  const DAY = 86_400_000, WEEK = 7 * DAY;
  const today = state.calls.filter(c => now - c.ts < DAY);
  const week  = state.calls.filter(c => now - c.ts < WEEK);

  const byProvider = {};
  for (const c of today) {
    if (!byProvider[c.provider]) byProvider[c.provider] = { calls: 0, costUSD: 0 };
    byProvider[c.provider].calls++;
    byProvider[c.provider].costUSD += c.costUSD || 0;
  }

  const byHour = Array.from({ length: 24 }, (_, i) => {
    const h = 23 - i;
    const bucket = state.calls.filter(c => Math.floor((now - c.ts) / 3_600_000) === h);
    const d = new Date(now - h * 3_600_000);
    return { hour: `${d.getHours()}:00`, calls: bucket.length,
      costUSD: bucket.reduce((s, c) => s + (c.costUSD || 0), 0) };
  });

  const userCosts = {};
  for (const c of today) {
    if (!c.userId) continue;
    if (!userCosts[c.userId]) userCosts[c.userId] = { costUSD: 0, calls: 0 };
    userCosts[c.userId].costUSD += c.costUSD || 0;
    userCosts[c.userId].calls++;
  }
  const topUsers = Object.entries(userCosts)
    .sort((a, b) => b[1].costUSD - a[1].costUSD)
    .slice(0, 10)
    .map(([userId, d]) => ({ userId, ...d }));

  const budgets = state.budgets.map(b => {
    const spent = _spentFor(b, now);
    return { ...b, spentUSD: spent, pct: Math.min((spent / b.limitUSD) * 100, 100) };
  });

  return {
    costToday:  today.reduce((s, c) => s + (c.costUSD || 0), 0),
    costWeek:   week .reduce((s, c) => s + (c.costUSD || 0), 0),
    callsToday: today.length,
    activeUsers: new Set(today.map(c => c.userId).filter(Boolean)).size,
    byProvider, byHour, topUsers, budgets,
    alerts: state.alerts.filter(a => !a.acked),
  };
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getCalls(limit = 200, userId) {
  let calls = state.calls;
  if (userId) calls = calls.filter(c => c.userId === userId);
  return calls.slice(0, limit);
}

module.exports = { calcCost, addCall, addBudget, removeBudget, addAlert, ackAlert,
  checkBudget, getStats, subscribe, getCalls, state };
