const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

const API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createInstance() {
  try {
    await axios.post(`${API_URL}/instance/create`, {
      instanceName: INSTANCE,
      integration: 'WHATSAPP-BAILEYS',
    }, {
      headers: { apikey: API_KEY },
    });
  } catch (e) {
    // Si ya existe, ignorar
  }
}

async function getQR() {
  const response = await axios.get(`${API_URL}/instance/connect/${INSTANCE}`, {
    headers: { apikey: API_KEY },
  });
  return response.data.base64;
}

async function main() {
  await createInstance();
  await wait(2000);

  const base64 = await getQR();
  if (!base64) {
    console.error('No se pudo obtener el QR');
    process.exit(1);
  }

  const qrPath = path.join(__dirname, 'qr-whatsapp.png');
  fs.writeFileSync(qrPath, Buffer.from(base64.split(',')[1], 'base64'));

  // Abrir la imagen con el visor predeterminado de Windows
  exec(`start "" "${qrPath}"`);

  // Configurar webhook
  await wait(1000);
  await axios.post(`${API_URL}/webhook/set/${INSTANCE}`, {
    webhook: {
      url: 'http://localhost:3000/webhook',
      enabled: true,
      events: ['MESSAGES_UPSERT'],
    }
  }, {
    headers: { apikey: API_KEY },
  });
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
