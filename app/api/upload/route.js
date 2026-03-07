import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const maxDuration = 30;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ─── Smart PDF text cleanup ──────────────────────────────────────────
// PDF extractors produce single \n for soft line-wraps within paragraphs.
// This function collapses those into spaces while preserving real paragraph breaks.
function cleanPdfText(rawText) {
  // Normalize line endings
  let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Handle hyphenated word breaks at end of line
  // e.g., "compre-\nhensive" → "comprehensive"
  text = text.replace(/([a-z])-\n([a-z])/g, "$1$2");

  // Normalize multiple blank lines to exactly two newlines
  text = text.replace(/\n{3,}/g, "\n\n");

  // Process line-by-line to collapse soft breaks into spaces
  const lines = text.split("\n");
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line → paragraph separator
    if (line.trim() === "") {
      result.push("");
      i++;
      continue;
    }

    // Accumulate continuation lines into current paragraph
    let paragraph = line.trimEnd();
    i++;

    while (i < lines.length) {
      const nextLine = lines[i];

      // Blank line = paragraph break
      if (nextLine.trim() === "") break;

      const nextTrimmed = nextLine.trimStart();
      const indent = nextLine.length - nextTrimmed.length;
      const prevEndsWithTerminal = /[.!?:;]["'\u201D\u2019)\]]*\s*$/.test(paragraph);
      const nextStartsLower = /^[a-z]/.test(nextTrimmed);
      const nextStartsWithListMarker = /^(\d+[.)]\s|[-*]\s|[A-Z][.)]\s)/.test(nextTrimmed);
      const nextIsShort = nextTrimmed.length < 40;
      const nextLooksLikeHeading = nextIsShort && /^[A-Z]/.test(nextTrimmed) && !/[.,:;]$/.test(nextTrimmed);

      // Significant indentation → new paragraph
      if (indent >= 4 && !nextStartsLower) break;

      // List item → new paragraph
      if (nextStartsWithListMarker) break;

      // Terminal punctuation + short uppercase line (heading) → new paragraph
      if (prevEndsWithTerminal && nextLooksLikeHeading) break;

      // Lowercase start → almost certainly a continuation
      if (nextStartsLower) {
        paragraph += " " + nextTrimmed;
        i++;
        continue;
      }

      // No terminal punctuation → mid-sentence wrap
      if (!prevEndsWithTerminal) {
        paragraph += " " + nextTrimmed;
        i++;
        continue;
      }

      // Terminal punctuation + uppercase start but no blank line →
      // treat as same paragraph (reflowed text, new sentence)
      paragraph += " " + nextTrimmed;
      i++;
    }

    result.push(paragraph);
  }

  // Rejoin: non-empty lines separated by \n\n
  let output = "";
  for (let j = 0; j < result.length; j++) {
    if (result[j] === "") {
      if (!output.endsWith("\n\n")) output += "\n\n";
    } else {
      if (output && !output.endsWith("\n\n")) output += "\n\n";
      output += result[j];
    }
  }

  return output.trim();
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
      const result = await pdfParse(buffer);
      text = cleanPdfText(result.text);
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
