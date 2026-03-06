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

// Strip proposal/profile blocks from text to get clean conversational content
export function stripStructuredBlocks(text) {
  return text
    .replace(/\[PROPOSAL\][\s\S]*?\[\/PROPOSAL\]/g, "")
    .replace(/\[VOICE_PROFILE\][\s\S]*?\[\/VOICE_PROFILE\]/g, "")
    // Also strip partial (still-streaming) blocks that haven't closed yet
    .replace(/\[PROPOSAL\][\s\S]*$/, "")
    .replace(/\[VOICE_PROFILE\][\s\S]*$/, "")
    .trim();
}

// Check if text contains a partial (still-streaming) proposal block
export function hasPartialProposal(text) {
  const openCount = (text.match(/\[PROPOSAL\]/g) || []).length;
  const closeCount = (text.match(/\[\/PROPOSAL\]/g) || []).length;
  return openCount > closeCount;
}
