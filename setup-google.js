const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');
require('dotenv').config();

const CREDENTIALS_FILE = path.join(__dirname, 'credentials', 'oauth-client.json');
const ENV_FILE = path.join(__dirname, '.env');

if (!fs.existsSync(CREDENTIALS_FILE)) {
  console.error('[ERROR] No se encontro el archivo credentials/oauth-client.json');
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE));
const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive'],
  prompt: 'consent',
});

console.log('  Abriendo el navegador para autorizar Google Drive...');
exec(`start "" "${authUrl}"`);

console.log();
console.log('  Si el navegador no abrio, copia este link manualmente:');
console.log('  ' + authUrl);
console.log();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('  Pega el codigo que te dio Google y presiona Enter: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());

    // Guardar el refresh token en el .env
    let envContent = fs.readFileSync(ENV_FILE, 'utf8');
    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
      envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/,`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`;
    }
    fs.writeFileSync(ENV_FILE, envContent);

    console.log('  [OK] Google Drive autorizado correctamente');
  } catch (err) {
    console.error('  [ERROR] No se pudo obtener el token:', err.message);
    process.exit(1);
  }
});
