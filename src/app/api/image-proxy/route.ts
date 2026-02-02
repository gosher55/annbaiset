import { auth } from "@/auth"
import { google } from "googleapis"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
        return NextResponse.json({ error: "Missing file ID" }, { status: 400 })
    }

    const session = await auth()
    // @ts-expect-error - session.accessToken
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const authClient = new google.auth.OAuth2()
        // @ts-expect-error - session.accessToken
        authClient.setCredentials({ access_token: session.accessToken })

        const drive = google.drive({ version: "v3", auth: authClient })

        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        )

        const headers = new Headers()
        headers.set("Content-Type", response.headers['content-type'] as string || "image/jpeg")
        headers.set("Cache-Control", "public, max-age=3600")

        // @ts-expect-error - stream type
        return new NextResponse(response.data, { headers })

    } catch (error: any) {
        console.error("Proxy Error:", error)
        return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 })
    }
}
