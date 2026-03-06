"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, ArrowRight, Sparkles } from "lucide-react";
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
  // Auto-suggest props
  justSavedBlockId,
  nextSuggestion,
  isSuggestingNext,
  onStartNextParagraph,
  onEditPrevious,
  onClearPostSave,
}) {
  const [insertingAfter, setInsertingAfter] = useState(null); // block id or "start"
  const [newText, setNewText] = useState("");
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [suggestionUsed, setSuggestionUsed] = useState(null); // track if textarea was pre-filled
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

  // Auto-dismiss hint bar after 30s
  useEffect(() => {
    if (!justSavedBlockId) return;
    const timer = setTimeout(() => {
      if (onClearPostSave) onClearPostSave();
    }, 30000);
    return () => clearTimeout(timer);
  }, [justSavedBlockId, onClearPostSave]);

  // Document-level keyboard listener for post-save shortcuts
  useEffect(() => {
    if (!justSavedBlockId) return;

    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in a textarea
      if (document.activeElement?.tagName === "TEXTAREA") return;
      if (document.activeElement?.tagName === "INPUT") return;

      // ⌘+Enter (without Shift) → Start next paragraph with suggestion
      if (e.key === "Enter" && e.metaKey && !e.shiftKey) {
        e.preventDefault();
        const suggestion = onStartNextParagraph();
        setInsertingAfter(justSavedBlockId);
        setNewText(suggestion);
        setSuggestionUsed(suggestion || null);
      }
      // ⇧+⌘+Enter → Edit previous paragraph
      if (e.key === "Enter" && e.metaKey && e.shiftKey) {
        e.preventDefault();
        const targetBlockId = onEditPrevious();
        if (targetBlockId) {
          setEditingBlockId(targetBlockId);
          if (onClearPostSave) onClearPostSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [justSavedBlockId, onStartNextParagraph, onEditPrevious, onClearPostSave]);

  const handleInsert = () => {
    if (newText.trim()) {
      // Determine author based on whether suggestion was used
      let author = "human";
      if (suggestionUsed) {
        author = newText.trim() === suggestionUsed.trim() ? "claude" : "collaborative";
      }
      onAddBlock(newText.trim(), insertingAfter, author);
      setNewText("");
      setInsertingAfter(null);
      setSuggestionUsed(null);
    }
  };

  const handleStartNext = () => {
    const suggestion = onStartNextParagraph();
    setInsertingAfter(justSavedBlockId);
    setNewText(suggestion);
    setSuggestionUsed(suggestion || null);
  };

  const handleEditPrev = () => {
    const targetBlockId = onEditPrevious();
    if (targetBlockId) {
      setEditingBlockId(targetBlockId);
      if (onClearPostSave) onClearPostSave();
    }
  };

  const renderInsertButton = (afterId) => {
    if (insertingAfter === afterId) {
      const isSuggestionPrefill = suggestionUsed && newText === suggestionUsed;
      return (
        <div style={{ padding: "8px 16px 8px 20px" }}>
          {/* Suggestion label */}
          {suggestionUsed && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, fontFamily: C.sans, marginBottom: 6,
              color: C.accent, opacity: 0.8,
            }}>
              <Sparkles size={12} />
              Claude's suggestion — edit freely, then ⌘+Enter to save
            </div>
          )}
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
              if (e.key === "Escape") {
                setInsertingAfter(null);
                setNewText("");
                setSuggestionUsed(null);
                if (onClearPostSave) onClearPostSave();
              }
            }}
            placeholder="Write your paragraph..."
            style={{
              width: "100%", background: C.bgComposer,
              border: `1px solid ${suggestionUsed ? C.accent : C.accent}`,
              borderRadius: 8, padding: "12px 14px", color: C.text, fontSize: 16,
              fontFamily: C.serif, lineHeight: 1.8, resize: "none", outline: "none",
              minHeight: 60,
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: C.sans, marginRight: "auto" }}>
              ⌘+Enter to add · Esc to cancel
            </span>
            <button onClick={() => { setInsertingAfter(null); setNewText(""); setSuggestionUsed(null); }} style={{
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
        <button onClick={() => {
          // If there's a pending suggestion, use it when clicking "+"
          if (justSavedBlockId && nextSuggestion) {
            const suggestion = onStartNextParagraph();
            setInsertingAfter(afterId);
            setNewText(suggestion);
            setSuggestionUsed(suggestion || null);
          } else {
            setInsertingAfter(afterId);
          }
        }} style={{
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

  // Shortcut hint bar
  const renderHintBar = () => {
    if (!justSavedBlockId) return null;

    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 20, padding: "10px 16px", background: C.bgComposer,
        borderRadius: 8, border: `0.5px solid ${C.border}`,
        margin: "8px 20px", animation: "fadeIn 0.3s ease",
      }}>
        <button onClick={handleStartNext} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "transparent", border: "none", cursor: "pointer",
          color: C.textSec, fontSize: 12, fontFamily: C.sans,
          padding: "4px 8px", borderRadius: 6, transition: "all 0.15s",
        }}
        onMouseOver={e => e.currentTarget.style.color = C.accent}
        onMouseOut={e => e.currentTarget.style.color = C.textSec}>
          <kbd style={{
            background: C.bgDeep, padding: "2px 6px", borderRadius: 4,
            fontSize: 11, fontFamily: C.mono, border: `1px solid ${C.border}`,
            color: C.text,
          }}>⌘↵</kbd>
          <span>Next paragraph</span>
          {isSuggestingNext && (
            <span style={{ color: C.textMuted, fontStyle: "italic", fontSize: 11 }}>
              thinking...
            </span>
          )}
          {!isSuggestingNext && nextSuggestion && (
            <Sparkles size={11} color={C.accent} />
          )}
        </button>

        <div style={{ width: 1, height: 16, background: C.border }} />

        <button onClick={handleEditPrev} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "transparent", border: "none", cursor: "pointer",
          color: C.textSec, fontSize: 12, fontFamily: C.sans,
          padding: "4px 8px", borderRadius: 6, transition: "all 0.15s",
        }}
        onMouseOver={e => e.currentTarget.style.color = C.blue}
        onMouseOut={e => e.currentTarget.style.color = C.textSec}>
          <kbd style={{
            background: C.bgDeep, padding: "2px 6px", borderRadius: 4,
            fontSize: 11, fontFamily: C.mono, border: `1px solid ${C.border}`,
            color: C.text,
          }}>⇧⌘↵</kbd>
          <span>Edit previous</span>
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
              editingBlockId={editingBlockId}
              onEditingComplete={() => setEditingBlockId(null)}
            />
          )}
          {/* Show hint bar after the just-saved block */}
          {block.id === justSavedBlockId && insertingAfter === null && renderHintBar()}
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
