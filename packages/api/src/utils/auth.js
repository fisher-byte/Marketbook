const crypto = require('crypto');

function generateId(prefix = '') {
  return prefix + crypto.randomBytes(12).toString('hex');
}

function generateApiKey() {
  return 'marketbook_' + crypto.randomBytes(24).toString('hex');
}

module.exports = { generateId, generateApiKey };
