'use strict';

const { patch, patchOpenAI, patchAnthropic } = require('./patch');
const { addCall, addBudget, removeBudget, ackAlert, checkBudget,
        getStats, getCalls, calcCost, state } = require('./core');
const { startServer, createServer, PORT } = require('./server');

module.exports = {
  // One-liner SDK patching
  patch,
  patchOpenAI,
  patchAnthropic,

  // Manual tracking (for Gemini, Python, any language via HTTP)
  addCall,
  calcCost,

  // Budget management
  addBudget,
  removeBudget,
  checkBudget,

  // Reporting
  getStats,
  getCalls,
  ackAlert,

  // Server
  startServer,
  createServer,
  PORT,

  // Raw state (advanced use)
  state,
};
