import { NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { getGoogleDriveClient } from '@/lib/google-drive';
import { Readable } from 'stream';

export async function GET() {
    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Spreadsheet ID not configured' }, { status: 500 });
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'아이들 정보'!A2:F", // Skip header
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            return NextResponse.json({ students: [] });
        }

        // Map rows to objects safely
        // Col A: Number, B: Name, C: Parent, D: Phone, E: Class, F: PhotoURL
        const students = rows.map((row) => ({
            id: row[0] || '',
            name: row[1] || '이름 없음',
            // skip C, D for privacy
            className: row[4] || '',
            photoUrl: row[5] || '',
        }));

        return NextResponse.json({ students });
    } catch (error: any) {
        console.error('Failed to fetch students:', error);
        if (error.response) {
            console.error('Google API Error:', JSON.stringify(error.response.data, null, 2));
        }
        return NextResponse.json({ error: 'Failed to fetch data', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const className = formData.get('className') as string;
        const file = formData.get('file') as File | null;

        if (!name || !className) {
            return NextResponse.json({ error: 'Name and Class are required' }, { status: 400 });
        }

        let photoUrl = '';

        // 1. Upload Photo to Drive (if provided)
        if (file) {
            const drive = await getGoogleDriveClient();

            // Check/Create '학생사진' Folder
            let folderId = '';
            const folderSearch = await drive.files.list({
                q: "mimeType='application/vnd.google-apps.folder' and name='학생사진' and trashed=false",
                fields: 'files(id, name)',
            });

            if (folderSearch.data.files && folderSearch.data.files.length > 0) {
                folderId = folderSearch.data.files[0].id!;
            } else {
                const folderMetadata = {
                    name: '학생사진',
                    mimeType: 'application/vnd.google-apps.folder',
                };
                const folder = await drive.files.create({
                    requestBody: folderMetadata,
                    fields: 'id',
                });
                folderId = folder.data.id!;
            }

            // Convert File to Stream
            const buffer = Buffer.from(await file.arrayBuffer());
            const stream = new Readable();
            stream.push(buffer);
            stream.push(null);

            // Upload File
            const fileMetadata = {
                name: `${name}_${Date.now()}.jpg`, // Unique name
                parents: [folderId],
            };
            const media = {
                mimeType: file.type,
                body: stream,
            };

            const uploadedFile = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, webViewLink',
            });

            // Use the Drive URL
            // We can use webViewLink, but for our proxy we just need the ID or the link
            photoUrl = uploadedFile.data.webViewLink || '';
        }

        // 2. Add to Google Sheets
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // Generate a simple ID (e.g., timestamp or max ID + 1)
        // For simplicity, let's use timestamp
        const id = Date.now().toString();

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "'아이들 정보'!A:F",
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    [id, name, '', '', className, photoUrl] // C, D are empty for now
                ],
            },
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Failed to add student:', error);
        return NextResponse.json({ error: 'Failed to add student', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { name, className } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // Find the row index
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'아이들 정보'!A:F",
        });

        const rows = response.data.values;
        if (!rows) return NextResponse.json({ error: 'No data found' }, { status: 404 });

        let rowIndex = -1;
        // Search rows (0-indexed in array, 1-indexed in sheet)
        for (let i = 0; i < rows.length; i++) {
            // Check Name (Col B -> index 1) and Class (Col E -> index 4)
            // If className is provided, check it too, otherwise just name
            if (rows[i][1] === name && (!className || rows[i][4] === className)) {
                rowIndex = i;
                break;
            }
        }

        if (rowIndex === -1) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Delete the row
        // Note: batchUpdate with deleteDimension is required to actually delete the row
        // rowIndex is 0-based, sheet uses 0-based index for deleteDimension

        // First, we need the sheetId (GID) of '아이들 정보'
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId,
        });
        const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === '아이들 정보');
        const sheetId = sheet?.properties?.sheetId;

        if (sheetId === undefined) {
            return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: rowIndex,
                                endIndex: rowIndex + 1,
                            },
                        },
                    },
                ],
            },
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Failed to delete student:', error);
        return NextResponse.json({ error: 'Failed to delete student', details: error.message }, { status: 500 });
    }
}
