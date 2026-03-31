const axios = require('axios');

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

async function sendMessage(phoneNumber, text) {
  await axios.post(
    `${BASE_URL}/message/sendText/${INSTANCE}`,
    {
      number: phoneNumber,
      text,
    },
    {
      headers: { apikey: API_KEY },
    }
  );
}

module.exports = { sendMessage };
