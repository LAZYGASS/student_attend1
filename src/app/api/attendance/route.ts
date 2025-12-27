import { NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, className, status, note } = body;

        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Spreadsheet ID not configured' }, { status: 500 });
        }

        // Current Timestamp
        const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        const todayStr = timestamp.split(' ')[0]; // Extract date part (e.g., "2024. 12. 24.")

        // 1. Fetch all rows to check for existing record
        const getRows = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'출석기록'!A:E",
        });

        const rows = getRows.data.values || [];

        let rowIndex = -1;
        // Start from end to find latest, but we want to update the entry for TODAY
        // Rows are 0-indexed in array, but 1-indexed in sheet
        for (let i = rows.length - 1; i >= 0; i--) {
            const row = rows[i];
            // Check if date matches AND name matches
            // row[0] is timestamp, row[1] is name
            if (row[0] && row[0].startsWith(todayStr) && row[1] === name) {
                rowIndex = i + 1; // Sheet row index (1-based)
                break;
            }
        }

        if (rowIndex !== -1) {
            // UPDATE existing row
            // We update the range for that specific row. 
            // Columns: A: Timestamp, B: Name, C: Status, D: Note, E: Class
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'출석기록'!A${rowIndex}:E${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [
                        [timestamp, name, status, note || '', className]
                    ],
                },
            });
        } else {
            // APPEND new row
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: "'출석기록'!A:E",
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [
                        [timestamp, name, status, note || '', className]
                    ],
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to record attendance:', error);
        // Log detailed google api error
        if (error.response) {
            console.error('Google API Error Data:', JSON.stringify(error.response.data, null, 2));
        }
        return NextResponse.json({
            error: 'Failed to record attendance',
            details: error.message
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Spreadsheet ID not configured' }, { status: 500 });
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'출석기록'!A2:E", // Skip header
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return NextResponse.json({ records: [] });
        }

        // Row format: [Timestamp, Name, Status, Note, ClassName]
        const records = rows.map((row) => ({
            timestamp: row[0] || '',
            name: row[1] || '',
            status: row[2] || '',
            note: row[3] || '',
            className: row[4] || '',
        })).reverse(); // Show newest first

        return NextResponse.json({ records });
    } catch (error: any) {
        console.error('Failed to fetch attendance records:', error);
        if (error.response) {
            console.error('Google API Error Data:', JSON.stringify(error.response.data, null, 2));
        }
        return NextResponse.json({ error: 'Failed to fetch records', details: error.message }, { status: 500 });
    }
}
