require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const webhookRouter = require('./webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy para Evolution API — debe registrarse ANTES de express.json()
// para que el body de los POST no sea consumido antes de ser reenviado.
// Se usa pathFilter para que las rutas completas lleguen a Evolution API intactas
// (ej: /instance/create → http://localhost:8081/instance/create)
const evolutionProxy = createProxyMiddleware({
  target: process.env.EVOLUTION_API_URL || 'http://localhost:8081',
  changeOrigin: true,
  pathFilter: ['/instance/**', '/message/**', '/chat/**', '/manager/**', '/webhook/set/**', '/webhook/find/**'],
});
app.use(evolutionProxy);

app.use(express.json({ limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/webhook', webhookRouter);

async function configurarWebhook() {
  // En Railway, RAILWAY_PUBLIC_DOMAIN se inyecta automáticamente
  const publicDomain = process.env.WEBHOOK_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/webhook` : null) ||
    `http://localhost:${PORT}/webhook`;
  const webhookUrl = publicDomain;
  const instance = process.env.EVOLUTION_INSTANCE;
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  // Reintentar hasta que Evolution API esté lista
  for (let i = 0; i < 10; i++) {
    try {
      await axios.post(`${apiUrl}/webhook/set/${instance}`, {
        webhook: {
          url: webhookUrl,
          enabled: true,
          events: ['MESSAGES_UPSERT'],
        }
      }, { headers: { apikey: apiKey } });
      console.log(`Webhook configurado: ${webhookUrl}`);
      return;
    } catch (e) {
      console.log(`Esperando Evolution API... (intento ${i + 1})`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error('No se pudo configurar el webhook');
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Evolution API apuntando a: ${process.env.EVOLUTION_API_URL}`);
  configurarWebhook();
});
