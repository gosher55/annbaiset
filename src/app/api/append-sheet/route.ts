import { auth } from "@/auth"
import { google } from "googleapis"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await auth()
    // @ts-expect-error - session.accessToken
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        // Body: { shopName, date, address, category, price, vat, wht, total, link }

        const authClient = new google.auth.OAuth2()
        // @ts-expect-error - session.accessToken
        authClient.setCredentials({ access_token: session.accessToken })

        const sheets = google.sheets({ version: "v4", auth: authClient })

        const spreadsheetId = process.env.GOOGLE_SHEET_ID

        if (!spreadsheetId) {
            return NextResponse.json({ error: "No Sheet ID configured" }, { status: 500 })
        }

        // Prepare row data
        // Check if sheet is empty (optional but good practice) or just append
        // We will try to append to A1 to let Sheets find the next empty row, but ensuring we are in the first columns
        // Values: [Date, Shop, Category, Address, ReceiptNo, Price, Discount, Vat, Wht, Total, Link]
        // Header: [Date, Shop, Category, Address, ReceiptNo, Price, Discount, Vat, Wht, Total, Link]
        // Index:  0     1     2         3        4          5      6         7    8    9      10

        const values = [[
            body.date,
            body.shopName,
            body.category,
            body.address,
            body.receiptNo,
            body.price,
            body.discount,
            body.vat,
            body.wht,
            body.total,
            body.link,
            body.note // Column L
        ]]

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Sheet1!A:A", // Force checking from Column A to avoid shifting
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS", // Explicitly insert rows
            requestBody: {
                values,
            },
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Sheets Append Error:", JSON.stringify(error, null, 2))
        return NextResponse.json({
            error: "Failed to append to Sheet",
            details: error.message || error.toString()
        }, { status: 500 })
    }
}
