const fs = require('fs');
const path = require('path');

const CLIENTS_FILE = path.join(__dirname, '..', 'data', 'clientes.json');

function getClientName(phoneNumber) {
  const clients = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));
  return clients[phoneNumber] || null;
}

module.exports = { getClientName };
