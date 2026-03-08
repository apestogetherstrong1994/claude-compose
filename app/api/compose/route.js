import Anthropic from "@anthropic-ai/sdk";
import { COMPOSE_SYSTEM_PROMPT } from "@/lib/system-prompt";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildDocumentContext(documentBlocks) {
  if (!documentBlocks || documentBlocks.length === 0) return "";
  const blocks = documentBlocks
    .filter(b => b.status === "accepted")
    .map(b => `[Block ${b.id}] (author: ${b.author})\n${b.text}`)
    .join("\n\n");
  return `\n\nCurrent document:\n${blocks}`;
}

function buildVoiceContext(voiceProfile) {
  if (!voiceProfile) return "";
  const entries = Object.entries(voiceProfile)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `\n\nVoice profile (match this style):\n${entries}`;
}

function buildCalibrationContext(calibration) {
  if (!calibration) return "";
  const entries = Object.entries(calibration)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `\n\nAuthor preferences:\n${entries}`;
}

export async function POST(request) {
  try {
    const { messages, documentBlocks, voiceProfile, calibration } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Window to last 10 messages
    const MAX_MESSAGES = 10;
    const windowedMessages = messages.length > MAX_MESSAGES
      ? messages.slice(-MAX_MESSAGES)
      : messages;

    // Ensure starts with user message
    const trimmedMessages = windowedMessages[0]?.role === "assistant"
      ? windowedMessages.slice(1)
      : windowedMessages;

    const formattedMessages = trimmedMessages.map(msg => ({
      role: msg.role,
      content: msg.content || msg.text || "",
    }));

    // Build system prompt with context
    const systemPrompt = COMPOSE_SYSTEM_PROMPT
      .replace("{DOCUMENT_CONTEXT}", buildDocumentContext(documentBlocks))
      .replace("{VOICE_PROFILE_CONTEXT}", buildVoiceContext(voiceProfile))
      .replace("{CALIBRATION_CONTEXT}", buildCalibrationContext(calibration));

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system: systemPrompt,
      messages: formattedMessages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              if (event.delta?.text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`)
                );
              }
            } else if (event.type === "message_start") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "start", model: event.message?.model })}\n\n`)
              );
            } else if (event.type === "message_stop") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "stop" })}\n\n`)
              );
            } else if (event.type === "message_delta") {
              const deltaData = {};
              if (event.usage) deltaData.usage = event.usage;
              if (event.delta?.stop_reason) deltaData.stopReason = event.delta.stop_reason;
              if (Object.keys(deltaData).length > 0) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "message_delta", ...deltaData })}\n\n`)
                );
              }
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Compose API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
