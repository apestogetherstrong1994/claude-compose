import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const maxDuration = 30;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name || "unknown";
    const ext = filename.split(".").pop()?.toLowerCase();

    if (!["docx", "pdf"].includes(ext)) {
      return Response.json(
        { error: "Only .docx and .pdf files are supported" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    let text = "";

    if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (ext === "pdf") {
      const result = await pdfParse(buffer);
      text = result.text;
    }

    if (!text.trim()) {
      return Response.json(
        { error: "Could not extract any text from the file." },
        { status: 400 }
      );
    }

    // Clean up extracted text: normalize whitespace, preserve paragraph breaks
    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const paragraphCount = text.split(/\n\n+/).filter(Boolean).length;

    return Response.json({ text, filename, paragraphCount });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      { error: "Failed to process file. Please try again." },
      { status: 500 }
    );
  }
}
