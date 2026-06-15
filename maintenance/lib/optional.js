'use strict';

const { execSync } = require('child_process');

/**
 * Require a module that may live in the local node_modules or in the global
 * install (the sandbox/CI provides Playwright globally). Returns null if the
 * module can't be found anywhere so callers can degrade gracefully.
 */
function optionalRequire(name) {
  try {
    return require(name);
  } catch (_) {
    /* try global */
  }
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(require('path').join(globalRoot, name));
  } catch (_) {
    return null;
  }
}

module.exports = { optionalRequire };
