const express = require('express');
const axios = require('axios');
const { getClientName } = require('./clients');
const { uploadFile } = require('./drive');
const { sendMessage } = require('./whatsapp');

const router = express.Router();

// Tipos de mensaje que contienen archivos
const FILE_MESSAGE_TYPES = ['documentMessage', 'imageMessage', 'audioMessage', 'videoMessage'];

// Deduplicación: evitar procesar el mismo mensaje dos veces
const procesados = new Set();
function yaFueProcesado(id) {
  if (procesados.has(id)) return true;
  procesados.add(id);
  // Limpiar después de 5 minutos para no acumular memoria
  setTimeout(() => procesados.delete(id), 5 * 60 * 1000);
  return false;
}

router.post('/', async (req, res) => {
  // Responder rápido para que Evolution API no reintente
  res.status(200).json({ received: true });

  const payload = req.body;

  // Log completo para debug
  console.log('[Webhook] Payload recibido:', JSON.stringify(payload, null, 2).slice(0, 1000));

  if (payload.event !== 'messages.upsert') return;

  const message = payload.data;
  if (!message) return;

  // Ignorar mensajes propios
  if (message.key?.fromMe) return;

  const messageType = message.message ? Object.keys(message.message)[0] : null;
  if (!FILE_MESSAGE_TYPES.includes(messageType)) return;

  const phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');

  // Ignorar si ya procesamos este mensaje exacto
  const msgId = message.key?.id;
  if (msgId && yaFueProcesado(msgId)) {
    console.log(`[Webhook] Mensaje duplicado ignorado: ${msgId}`);
    return;
  }

  const messageContent = message.message[messageType];

  const fileName = messageContent.fileName || messageContent.title || `archivo_${Date.now()}`;
  const mimeType = messageContent.mimetype || 'application/octet-stream';
  const mediaUrl = messageContent.url;

  console.log(`[Webhook] Archivo recibido de ${phoneNumber}: ${fileName}`);

  try {
    // Identificar cliente - ignorar si no está registrado
    const clientName = getClientName(phoneNumber);
    if (!clientName) {
      console.log(`[Webhook] Número no registrado, ignorando: ${phoneNumber}`);
      return;
    }
    console.log(`[Webhook] Cliente identificado: ${clientName}`);

    // Descargar el archivo desencriptado via Evolution API
    const mediaResponse = await axios.post(
      `${process.env.EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${process.env.EVOLUTION_INSTANCE}`,
      { message: { key: message.key, message: message.message }, convertToMp4: false },
      { headers: { apikey: process.env.EVOLUTION_API_KEY } }
    );
    const fileBuffer = Buffer.from(mediaResponse.data.base64, 'base64');

    // Subir a Google Drive
    const driveFile = await uploadFile(clientName, fileName, mimeType, fileBuffer);
    console.log(`[Drive] Archivo subido: ${driveFile.webViewLink}`);

    // Confirmar por WhatsApp
    await sendMessage(phoneNumber, `Hola! Recibimos tu archivo "${fileName}" y lo guardamos correctamente. Gracias.`);
    console.log(`[WhatsApp] Confirmación enviada a ${phoneNumber}`);
  } catch (err) {
    console.error(`[Error] al procesar archivo de ${phoneNumber}:`, err.message);
  }
});

module.exports = router;
