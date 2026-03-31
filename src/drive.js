const { google } = require('googleapis');
const path = require('path');
const { Readable } = require('stream');

const CREDENTIALS_FILE = path.join(__dirname, '..', 'credentials', 'oauth-client.json');
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

function getAuthClient() {
  const credentials = require(CREDENTIALS_FILE);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
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
