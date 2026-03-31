const { google } = require('googleapis');
const path = require('path');
const { Readable } = require('stream');

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

function getAuthClient() {
  // Soporte para credenciales via variables de entorno (Railway) o archivo local
  let client_id, client_secret, redirect_uri;

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    client_id = process.env.GOOGLE_CLIENT_ID;
    client_secret = process.env.GOOGLE_CLIENT_SECRET;
    redirect_uri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost';
  } else {
    const CREDENTIALS_FILE = path.join(__dirname, '..', 'credentials', 'oauth-client.json');
    const credentials = require(CREDENTIALS_FILE);
    const creds = credentials.installed || credentials.web;
    client_id = creds.client_id;
    client_secret = creds.client_secret;
    redirect_uri = creds.redirect_uris[0];
  }

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oAuth2Client;
}

async function ensureClientFolder(drive, clientName) {
  const response = await drive.files.list({
    q: `name='${clientName}' and mimeType='application/vnd.google-apps.folder' and '${ROOT_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id, name)',
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: clientName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [ROOT_FOLDER_ID],
    },
    fields: 'id',
  });

  return folder.data.id;
}

async function uploadFile(clientName, fileName, mimeType, buffer) {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const folderId = await ensureClientFolder(drive, clientName);

  const fileStream = Readable.from(buffer);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType || 'application/octet-stream',
      body: fileStream,
    },
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

module.exports = { uploadFile };
