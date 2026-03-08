// Parse [PROPOSAL] and [VOICE_PROFILE] blocks from Claude's streamed text

export function parseProposals(text) {
  const proposals = [];
  const regex = /\[PROPOSAL\]\s*([\s\S]*?)\[\/PROPOSAL\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const block = match[1];
    const proposal = {};

    const targetMatch = block.match(/target:\s*(.+)/);
    const typeMatch = block.match(/type:\s*(.+)/);
    const reasoningMatch = block.match(/reasoning:\s*(.+)/);
    const textMatch = block.match(/text:\s*([\s\S]*?)$/);

    if (targetMatch) proposal.target = targetMatch[1].trim();
    if (typeMatch) proposal.type = typeMatch[1].trim();
    if (reasoningMatch) proposal.reasoning = reasoningMatch[1].trim();
    if (textMatch) proposal.text = textMatch[1].trim();

    if (proposal.text) proposals.push(proposal);
  }

  return proposals;
}

export function parseVoiceProfile(text) {
  const match = text.match(/\[VOICE_PROFILE\]\s*\n([\s\S]*?)\[\/VOICE_PROFILE\]/);
  if (!match) return null;

  const block = match[1];
  const profile = {};

  const fields = ["tone", "sentences", "vocabulary", "structure", "signature"];
  for (const field of fields) {
    const fieldMatch = block.match(new RegExp(`${field}:\\s*(.+)`));
    if (fieldMatch) profile[field] = fieldMatch[1].trim();
  }

  return Object.keys(profile).length > 0 ? profile : null;
}

// Strip proposal/profile/rewrite blocks from text to get clean conversational content
export function stripStructuredBlocks(text) {
  return text
    .replace(/\[PROPOSAL\][\s\S]*?\[\/PROPOSAL\]/g, "")
    .replace(/\[VOICE_PROFILE\][\s\S]*?\[\/VOICE_PROFILE\]/g, "")
    .replace(/\[REWRITE\][\s\S]*?\[\/REWRITE\]/g, "")
    // Also strip partial (still-streaming) blocks that haven't closed yet
    .replace(/\[PROPOSAL\][\s\S]*$/, "")
    .replace(/\[VOICE_PROFILE\][\s\S]*$/, "")
    .replace(/\[REWRITE\][\s\S]*$/, "")
    .trim();
}

// Check if text contains a partial (still-streaming) proposal block
export function hasPartialProposal(text) {
  const openCount = (text.match(/\[PROPOSAL\]/g) || []).length;
  const closeCount = (text.match(/\[\/PROPOSAL\]/g) || []).length;
  return openCount > closeCount;
}

// ─── REWRITE parsing (for polish mode) ───────────────────────────────

// Parse a complete [REWRITE] block into an array of revision objects
export function parseRewrite(text) {
  const rewriteMatch = text.match(/\[REWRITE\]\s*([\s\S]*?)\[\/REWRITE\]/);
  if (!rewriteMatch) return [];

  const body = rewriteMatch[1];
  const revisions = [];
  const paragraphRegex = /\[PARAGRAPH\s+\d+\]\s*([\s\S]*?)\[\/PARAGRAPH\]/g;
  let match;

  while ((match = paragraphRegex.exec(body)) !== null) {
    const block = match[1];
    const revision = {};

    const origMatch = block.match(/original_block:\s*(.+)/);
    const statusMatch = block.match(/status:\s*(.+)/);
    const reasoningMatch = block.match(/reasoning:\s*(.+)/);
    const textMatch = block.match(/text:\s*([\s\S]*?)$/);

    if (origMatch) revision.originalBlockId = origMatch[1].trim();
    if (statusMatch) revision.status = statusMatch[1].trim();
    if (reasoningMatch) revision.reasoning = reasoningMatch[1].trim();
    if (textMatch) revision.text = textMatch[1].trim();

    revision.decision = null; // will be set during review
    revisions.push(revision);
  }

  return revisions;
}

// Parse a partial (streaming) [REWRITE] block
export function parseStreamingRewrite(text) {
  // Check if we're inside a [REWRITE] block
  const rewriteStart = text.indexOf("[REWRITE]");
  if (rewriteStart === -1) return { revisions: [], partial: null };

  const rewriteEnd = text.indexOf("[/REWRITE]");
  const body = rewriteEnd !== -1
    ? text.slice(rewriteStart + 9, rewriteEnd)
    : text.slice(rewriteStart + 9);

  const revisions = [];
  const paragraphRegex = /\[PARAGRAPH\s+\d+\]\s*([\s\S]*?)\[\/PARAGRAPH\]/g;
  let match;

  while ((match = paragraphRegex.exec(body)) !== null) {
    const block = match[1];
    const revision = {};

    const origMatch = block.match(/original_block:\s*(.+)/);
    const statusMatch = block.match(/status:\s*(.+)/);
    const reasoningMatch = block.match(/reasoning:\s*(.+)/);
    const textMatch = block.match(/text:\s*([\s\S]*?)$/);

    if (origMatch) revision.originalBlockId = origMatch[1].trim();
    if (statusMatch) revision.status = statusMatch[1].trim();
    if (reasoningMatch) revision.reasoning = reasoningMatch[1].trim();
    if (textMatch) revision.text = textMatch[1].trim();

    revision.decision = null;
    revisions.push(revision);
  }

  // Check for a partial (unclosed) paragraph block
  let partial = null;
  const lastOpenParagraph = body.lastIndexOf("[PARAGRAPH");
  const lastCloseParagraph = body.lastIndexOf("[/PARAGRAPH]");

  if (lastOpenParagraph !== -1 && (lastCloseParagraph === -1 || lastOpenParagraph > lastCloseParagraph)) {
    const partialBody = body.slice(lastOpenParagraph);
    partial = {};

    const origMatch = partialBody.match(/original_block:\s*(.+)/);
    const statusMatch = partialBody.match(/status:\s*(.+)/);
    const reasoningMatch = partialBody.match(/reasoning:\s*(.+)/);
    const textMatch = partialBody.match(/text:\s*([\s\S]*?)$/);

    if (origMatch) partial.originalBlockId = origMatch[1].trim();
    if (statusMatch) partial.status = statusMatch[1].trim();
    if (reasoningMatch) partial.reasoning = reasoningMatch[1].trim();
    if (textMatch) partial.text = textMatch[1].trim();
  }

  return { revisions, partial };
}
