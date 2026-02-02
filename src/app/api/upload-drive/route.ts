import { auth } from "@/auth"
import { google } from "googleapis"
import { Readable } from "stream"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await auth()
    // @ts-expect-error - session.accessToken was added in auth.ts
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        const authClient = new google.auth.OAuth2()
        // @ts-expect-error - session.accessToken
        authClient.setCredentials({ access_token: session.accessToken })

        const drive = google.drive({ version: "v3", auth: authClient })

        const buffer = Buffer.from(await file.arrayBuffer())
        const stream = new Readable()
        stream.push(buffer)
        stream.push(null)

        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

        const response = await drive.files.create({
            requestBody: {
                name: `Receipt_${Date.now()}_${file.name}`,
                parents: folderId ? [folderId] : undefined,
            },
            media: {
                mimeType: file.type,
                body: stream,
            },
            fields: "id, webViewLink",
        })

        return NextResponse.json({
            fileId: response.data.id,
            link: response.data.webViewLink
        })

    } catch (error: any) {
        console.error("Drive Upload Error:", JSON.stringify(error, null, 2))
        return NextResponse.json({
            error: "Failed to upload to Drive",
            details: error.message || error.toString()
        }, { status: 500 })
    }
}
