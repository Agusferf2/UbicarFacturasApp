const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_FILE = path.join(__dirname, 'credentials', 'oauth-client.json');
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE));

const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

console.log('\n=== PASO 1 ===');
console.log('Abrí este enlace en tu navegador y autorizá la app:\n');
console.log(authUrl);
console.log('\n=== PASO 2 ===');
console.log('Después de autorizar, Google te va a dar un código. Pegalo acá:\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Código: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log('\n=== LISTO ===');
    console.log('Copiá esta línea y agregala a tu archivo .env:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\nTambién guardalo porque no te lo van a mostrar de nuevo.');
  } catch (err) {
    console.error('Error al obtener el token:', err.message);
  }
});
