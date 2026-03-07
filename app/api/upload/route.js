import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";

export const maxDuration = 60;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Use Claude to extract properly chunked text from a PDF ─────────
// Claude reads PDFs natively and understands paragraph structure far
// better than any heuristic-based text parser can.
async function extractPdfWithClaude(buffer) {
  const base64 = buffer.toString("base64");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: `Extract all the text from this document. Reproduce the text exactly as written — do not summarize, rephrase, or omit anything.

Rules:
- Separate distinct paragraphs with exactly one blank line between them
- Do NOT add blank lines within a single paragraph — keep each paragraph as one continuous block of text
- Preserve the original wording, punctuation, and spelling exactly
- Strip headers/footers, page numbers, and decorative elements
- For letter-style documents: the date, address, greeting, and closing are each their own paragraph
- Output ONLY the extracted text — no commentary, no labels, no markdown formatting`,
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n\n");

  return text.trim();
}

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
      // Mammoth produces proper paragraph breaks; simple cleanup suffices
      text = result.value
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    } else if (ext === "pdf") {
      text = await extractPdfWithClaude(buffer);
    }

    if (!text.trim()) {
      return Response.json(
        { error: "Could not extract any text from the file." },
        { status: 400 }
      );
    }

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
