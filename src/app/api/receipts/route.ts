import { auth } from "@/auth"
import { google } from "googleapis"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await auth()
    // @ts-expect-error - session.accessToken
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const authClient = new google.auth.OAuth2()
        // @ts-expect-error - session.accessToken
        authClient.setCredentials({ access_token: session.accessToken })

        const sheets = google.sheets({ version: "v4", auth: authClient })
        const spreadsheetId = process.env.GOOGLE_SHEET_ID

        if (!spreadsheetId) {
            return NextResponse.json({ error: "No Sheet ID configured" }, { status: 500 })
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Sheet1!A:K", // Columns A to K based on our append logic
        })

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return NextResponse.json([])
        }

        // Map rows to objects
        // Assuming append order: [Date, Shop, Category, Address, ReceiptNo, Price, Discount, Vat, Wht, Total, Link]
        const receipts = rows.map((row, index) => {
            // Skip header if it exists (heuristic: Date/Shop in first row)
            // But usually we just return all and let frontend filter or we just assume strict 
            // Let's return raw for now, maybe filter empty
            if (row.length === 0) return null;

            return {
                id: index, // Use index as ID for now
                date: row[0],
                shopName: row[1],
                category: row[2],
                address: row[3],
                receiptNo: row[4],
                price: row[5],
                discount: row[6],
                vat: row[7],
                wht: row[8],
                total: row[9],
                link: row[10],
                note: row[11]
            }
        }).filter(r => r !== null);

        return NextResponse.json(receipts)

    } catch (error: any) {
        console.error("Fetch Sheets Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
