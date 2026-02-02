'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function processReceiptWithGemini(formData: FormData) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        console.log("DEBUG: Full API Key:", apiKey);
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing in .env.local. Please restart your server.");
        }
        const genAI = new GoogleGenerativeAI(apiKey);

        const file = formData.get("file") as File;
        if (!file) {
            throw new Error("No file uploaded");
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

        const prompt = `
            Analyze this receipt image (Thai/English) and extract the following data into a strict JSON format (no markdown code blocks, just raw JSON).
            If a field is missing, use null or empty string. Returns numbers as numbers.

            Fields:
            - shopName: string (Name of the shop/vendor)
            - date: string (Format YYYY-MM-DD. Convert BE dates like 2567 to 2024)
            - address: string (Full address)
            - receiptNo: string (Invoice/Receipt number)
            - category: string (One of: food, transport, shopping, utilities, medical, other. Infer from items.)
            - price: number (Subtotal / Price BEFORE Tax / included price if no tax breakdown)
            - discount: number (Total discount amount)
            - vat: number (VAT amount)
            - wht: number (Withholding tax amount)
            - total: number (Grand Total / Net Amount / Final Payment. This must be the largest, final value found)
            
            Key Rules:
            - "Total" MUST be the final Net Amount (ยอดสุทธิ).
            - "Price" is the Subtotal (รวมเป็นเงิน) before VAT/Discount.
            - If "Discount" appears, extract the value.
            - Trust the printed numbers. Do not recalculate manually unless necessary.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown if present
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonStr);

        return { success: true, data };

    } catch (error: any) {
        console.error("Gemini OCR Error:", error);
        return { success: false, error: error.message };
    }
}
