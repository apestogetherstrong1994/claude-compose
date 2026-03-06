"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { C } from "../design-system";
import { ParagraphBlock } from "./ParagraphBlock";
import { ProposalBlock } from "./ProposalBlock";
import { ContributionBar } from "./ContributionBar";

export function DocumentPanel({
  blocks,
  proposals,
  streamingProposal,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onAcceptProposal,
  onRejectProposal,
  onRiffProposal,
}) {
  const [insertingAfter, setInsertingAfter] = useState(null); // block id or "start"
  const [newText, setNewText] = useState("");
  const textareaRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (insertingAfter !== null && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [insertingAfter]);

  // Auto-scroll to bottom when new blocks/proposals arrive
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [blocks.length, proposals.length, streamingProposal]);

  const handleInsert = () => {
    if (newText.trim()) {
      onAddBlock(newText.trim(), insertingAfter);
      setNewText("");
      setInsertingAfter(null);
    }
  };

  const renderInsertButton = (afterId) => {
    if (insertingAfter === afterId) {
      return (
        <div style={{ padding: "8px 16px 8px 20px" }}>
          <textarea
            ref={textareaRef}
            value={newText}
            onChange={e => {
              setNewText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && e.metaKey) handleInsert();
              if (e.key === "Escape") { setInsertingAfter(null); setNewText(""); }
            }}
            placeholder="Write your paragraph..."
            style={{
              width: "100%", background: C.bgComposer, border: `1px solid ${C.accent}`,
              borderRadius: 8, padding: "12px 14px", color: C.text, fontSize: 16,
              fontFamily: C.serif, lineHeight: 1.8, resize: "none", outline: "none",
              minHeight: 60,
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: C.sans, marginRight: "auto" }}>
              ⌘+Enter to add · Esc to cancel
            </span>
            <button onClick={() => { setInsertingAfter(null); setNewText(""); }} style={{
              padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
              background: "transparent", color: C.textMuted, fontSize: 12,
              fontFamily: C.sans, cursor: "pointer",
            }}>
              Cancel
            </button>
            <button onClick={handleInsert} disabled={!newText.trim()} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 14px",
              borderRadius: 6, border: "none",
              background: newText.trim() ? C.accent : C.bgHover,
              color: newText.trim() ? "#fff" : C.textMuted,
              fontSize: 12, fontFamily: C.sans, cursor: newText.trim() ? "pointer" : "default",
            }}>
              Add <ArrowRight size={12} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        display: "flex", justifyContent: "center", padding: "4px 0",
        opacity: 0, transition: "opacity 0.15s",
      }}
      onMouseOver={e => e.currentTarget.style.opacity = "1"}
      onMouseOut={e => e.currentTarget.style.opacity = "0"}>
        <button onClick={() => setInsertingAfter(afterId)} style={{
          display: "flex", alignItems: "center", gap: 4, padding: "4px 12px",
          borderRadius: C.radiusPill, border: `1px dashed ${C.border}`,
          background: "transparent", color: C.textMuted, fontSize: 11,
          fontFamily: C.sans, cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
          <Plus size={11} /> Add paragraph
        </button>
      </div>
    );
  };

  // Find proposals targeting specific positions
  const getProposalAfter = (blockId) => {
    return proposals.find(p => p.target === `after_block_${blockId}`);
  };

  const hasContent = blocks.length > 0 || proposals.length > 0 || streamingProposal;

  return (
    <div ref={panelRef} style={{
      flex: 1, minWidth: 300, overflowY: "auto", padding: "24px 40px",
      display: "flex", flexDirection: "column",
    }}>
      {hasContent && <ContributionBar blocks={blocks} />}

      {/* Empty state */}
      {!hasContent && insertingAfter !== "start" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
        }}>
          <div style={{ fontSize: 14, color: C.textMuted, fontFamily: C.sans, textAlign: "center" }}>
            Your document will appear here as you write.
          </div>
          <button onClick={() => setInsertingAfter("start")} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
            borderRadius: C.radiusPill, border: `1px dashed ${C.borderHover}`,
            background: "transparent", color: C.textSec, fontSize: 13,
            fontFamily: C.sans, cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.textSec; }}>
            <Plus size={14} /> Start writing
          </button>
        </div>
      )}

      {/* Insert at start - always show when inserting */}
      {insertingAfter === "start" && renderInsertButton("start")}

      {/* Insert at start (when document has content) */}
      {hasContent && insertingAfter !== "start" && renderInsertButton("start")}

      {/* Blocks + proposals */}
      {blocks.map((block) => (
        <div key={block.id}>
          {block.status === "accepted" && (
            <ParagraphBlock
              block={block}
              onUpdate={onUpdateBlock}
              onDelete={onDeleteBlock}
            />
          )}
          {renderInsertButton(block.id)}
          {/* Show proposal after this block */}
          {getProposalAfter(block.id) && (
            <ProposalBlock
              proposal={getProposalAfter(block.id)}
              onAccept={() => onAcceptProposal(getProposalAfter(block.id))}
              onReject={() => onRejectProposal(getProposalAfter(block.id))}
              onRiff={(text) => onRiffProposal(getProposalAfter(block.id), text)}
            />
          )}
        </div>
      ))}

      {/* Streaming proposal (appears at end if no specific target) */}
      {streamingProposal && (
        <ProposalBlock
          proposal={streamingProposal}
          isStreaming={true}
          onAccept={() => {}}
          onReject={() => {}}
          onRiff={() => {}}
        />
      )}

      {/* Proposals without specific targets (new paragraphs at end) */}
      {proposals
        .filter(p => !p.target || p.target === "end" || !p.target.startsWith("after_block_"))
        .map((proposal, i) => (
          <ProposalBlock
            key={`proposal-${i}`}
            proposal={proposal}
            onAccept={() => onAcceptProposal(proposal)}
            onReject={() => onRejectProposal(proposal)}
            onRiff={(text) => onRiffProposal(proposal, text)}
          />
        ))}
    </div>
  );
}
