import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        // 1. Extract File ID from Google Drive URL
        // Supports formats:
        // - https://drive.google.com/file/d/FILE_ID/view...
        // - https://drive.google.com/open?id=FILE_ID
        let fileId = '';
        const patterns = [
            /\/file\/d\/([^/]+)/,
            /id=([^&]+)/,
            /\/d\/([^/]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                fileId = match[1];
                break;
            }
        }

        if (!fileId) {
            // If not a drive URL, redirect to original URL (fallback)
            return NextResponse.redirect(url);
        }

        // 2. Authenticate with Service Account
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // 3. Fetch Image Stream
        const response = await drive.files.get(
            {
                fileId: fileId,
                alt: 'media',
            },
            { responseType: 'stream' }
        );

        // 4. Return Stream Response
        // We need to convert the Node.js stream to a Web Stream for Next.js
        // @ts-ignore
        const stream = response.data;

        const headers = new Headers();
        headers.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year

        // @ts-ignore
        return new NextResponse(stream, { headers });

    } catch (error: any) {
        console.error('Proxy Error:', error.message);
        // Fallback to original URL if proxy fails (e.g., permission error)
        return NextResponse.redirect(url);
    }
}
