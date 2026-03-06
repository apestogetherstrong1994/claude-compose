"use client";

import { C } from "../design-system";

// Simple inline markdown: **bold**, *italic*, `code`
export function InlineMarkdown({ text }) {
  if (!text) return null;

  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic: *text*
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    // Code: `text`
    const codeMatch = remaining.match(/`(.+?)`/);

    // Find earliest match
    let earliest = null;
    let earliestIndex = remaining.length;

    if (boldMatch && boldMatch.index < earliestIndex) {
      earliest = { type: "bold", match: boldMatch };
      earliestIndex = boldMatch.index;
    }
    if (codeMatch && codeMatch.index < earliestIndex) {
      earliest = { type: "code", match: codeMatch };
      earliestIndex = codeMatch.index;
    }
    if (italicMatch && italicMatch.index < earliestIndex && (!boldMatch || italicMatch.index !== boldMatch.index)) {
      earliest = { type: "italic", match: italicMatch };
      earliestIndex = italicMatch.index;
    }

    if (!earliest) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    // Add text before match
    if (earliestIndex > 0) {
      parts.push(<span key={key++}>{remaining.substring(0, earliestIndex)}</span>);
    }

    const m = earliest.match;
    if (earliest.type === "bold") {
      parts.push(<strong key={key++} style={{ fontWeight: 600 }}>{m[1]}</strong>);
    } else if (earliest.type === "italic") {
      parts.push(<em key={key++}>{m[1]}</em>);
    } else if (earliest.type === "code") {
      parts.push(
        <code key={key++} style={{
          background: C.bgCode, padding: "1px 5px", borderRadius: 4,
          fontSize: "0.9em", fontFamily: C.mono,
        }}>
          {m[1]}
        </code>
      );
    }

    remaining = remaining.substring(earliestIndex + m[0].length);
  }

  return <>{parts}</>;
}
