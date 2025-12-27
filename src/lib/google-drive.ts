import { google } from 'googleapis';

export async function getGoogleDriveClient() {
    // Handle private key with robust newline and quote stripping
    const privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const formattedKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '');

    const credentials = {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: formattedKey,
    };

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'], // Scope for accessing files created by the app or specific files
    });

    return google.drive({ version: 'v3', auth });
}
