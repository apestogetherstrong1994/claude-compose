"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, PenLine, ArrowRight, Sparkles, Loader } from "lucide-react";
import { C } from "../design-system";

export function PolishPanel({
  blocks,
  polishRevisions,
  streamingRevisions,
  reviewIndex,
  isStreaming,
  onAcceptRevision,
  onRejectRevision,
  onEditRevision,
  onAssemble,
  polishComplete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const editTextareaRef = useRef(null);
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);

  // Use streaming revisions while streaming, finalized after
  const revisions = polishRevisions.length > 0 ? polishRevisions : streamingRevisions;
  const total = revisions.length;
  const hasRevisions = total > 0;
  const allDone = polishComplete;

  // Auto-focus edit textarea
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height = editTextareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  // Reset editing when review index changes
  useEffect(() => {
    setIsEditing(false);
    setEditText("");
  }, [reviewIndex]);

  // Scroll the currently-reviewed paragraph into view
  useEffect(() => {
    if (!hasRevisions || reviewIndex >= total) return;
    const leftEl = leftColRef.current?.querySelector(`[data-review-index="${reviewIndex}"]`);
    const rightEl = rightColRef.current?.querySelector(`[data-review-index="${reviewIndex}"]`);
    if (leftEl) leftEl.scrollIntoView({ behavior: "smooth", block: "center" });
    if (rightEl) rightEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [reviewIndex, hasRevisions, total]);

  const handleEdit = () => {
    const currentRevision = revisions[reviewIndex];
    setEditText(currentRevision?.text || "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEditRevision(reviewIndex, editText.trim());
      setIsEditing(false);
      setEditText("");
    }
  };

  // Find original block for a revision
  const getOriginalBlock = (revision) => {
    if (!revision?.originalBlockId) return null;
    return blocks.find(b => b.id === revision.originalBlockId);
  };

  // Determine paragraph status display
  const getDecisionLabel = (revision) => {
    if (!revision.decision) return null;
    if (revision.decision === "accepted") return { text: "Accepted", color: C.green };
    if (revision.decision === "rejected") return { text: "Kept original", color: C.textMuted };
    if (revision.decision === "edited") return { text: "Edited", color: C.blue };
    return null;
  };

  return (
    <div style={{
      flex: 1, minWidth: 300, display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Progress header */}
      <div style={{
        padding: "16px 24px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <Sparkles size={16} color={C.accent} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 13, fontFamily: C.sans, fontWeight: 500,
            color: C.text, marginBottom: 6,
          }}>
            {isStreaming && !hasRevisions
              ? "Claude is reviewing your document..."
              : allDone
                ? "All paragraphs reviewed"
                : hasRevisions
                  ? `Reviewing paragraph ${Math.min(reviewIndex + 1, total)} of ${total}`
                  : "Preparing review..."
            }
          </div>
          {/* Progress bar */}
          {hasRevisions && (
            <div style={{
              height: 3, background: C.bgDeep, borderRadius: 2, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: C.accent,
                width: `${allDone ? 100 : (reviewIndex / total) * 100}%`,
                transition: "width 0.3s ease",
              }} />
            </div>
          )}
          {isStreaming && hasRevisions && (
            <div style={{
              fontSize: 11, color: C.textMuted, fontFamily: C.sans,
              marginTop: 4, display: "flex", alignItems: "center", gap: 4,
            }}>
              <Loader size={10} style={{ animation: "spin 1s linear infinite" }} />
              Still receiving revisions...
            </div>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{
        flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 0, overflow: "hidden",
      }}>
        {/* Left column: Original */}
        <div
          ref={leftColRef}
          style={{
            overflowY: "auto", padding: "20px 24px",
            borderRight: `1px solid ${C.border}`,
          }}
        >
          <div style={{
            fontSize: 11, fontFamily: C.sans, fontWeight: 600,
            color: C.textMuted, textTransform: "uppercase",
            letterSpacing: "0.05em", marginBottom: 16,
          }}>
            Your Draft
          </div>

          {blocks.filter(b => b.status === "accepted").map((block, i) => {
            const revisionIndex = revisions.findIndex(r => r.originalBlockId === block.id);
            const revision = revisionIndex !== -1 ? revisions[revisionIndex] : null;
            const isCurrent = revisionIndex === reviewIndex && !allDone && !isStreaming;
            const isReviewed = revision?.decision != null;
            const decisionLabel = revision ? getDecisionLabel(revision) : null;

            return (
              <div
                key={block.id}
                data-review-index={revisionIndex}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginBottom: 8,
                  border: isCurrent
                    ? `1.5px solid ${C.accent}`
                    : `1px solid transparent`,
                  background: isCurrent
                    ? C.accentSoft
                    : isReviewed && revision?.decision === "rejected"
                      ? "transparent"
                      : isReviewed
                        ? "rgba(0,0,0,0.08)"
                        : "transparent",
                  transition: "all 0.2s",
                  opacity: isReviewed && revision?.decision !== "rejected" ? 0.5 : 1,
                  position: "relative",
                }}
              >
                <p style={{
                  fontFamily: C.serif, fontSize: 15, lineHeight: 1.8,
                  color: C.text, margin: 0, whiteSpace: "pre-wrap",
                  textDecoration: isReviewed && revision?.decision === "accepted" ? "line-through" : "none",
                  textDecorationColor: C.textMuted,
                }}>
                  {block.text}
                </p>
                {decisionLabel && (
                  <div style={{
                    fontSize: 10, fontFamily: C.sans, color: decisionLabel.color,
                    marginTop: 6, fontWeight: 500,
                  }}>
                    {decisionLabel.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right column: Suggested */}
        <div
          ref={rightColRef}
          style={{
            overflowY: "auto", padding: "20px 24px",
          }}
        >
          <div style={{
            fontSize: 11, fontFamily: C.sans, fontWeight: 600,
            color: C.accent, textTransform: "uppercase",
            letterSpacing: "0.05em", marginBottom: 16,
          }}>
            Suggested Revision
          </div>

          {!hasRevisions && isStreaming && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "60px 20px", gap: 12,
            }}>
              <Loader size={20} color={C.accent} style={{ animation: "spin 1s linear infinite" }} />
              <div style={{ fontSize: 13, color: C.textMuted, fontFamily: C.sans }}>
                Claude is reading and revising your document...
              </div>
            </div>
          )}

          {revisions.map((revision, i) => {
            const isCurrent = i === reviewIndex && !allDone && !isStreaming;
            const isReviewed = revision.decision != null;
            const isUnchanged = revision.status === "unchanged";
            const decisionLabel = getDecisionLabel(revision);

            return (
              <div
                key={i}
                data-review-index={i}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginBottom: 8,
                  border: isCurrent
                    ? `1.5px solid ${C.accent}`
                    : `1px solid transparent`,
                  background: isCurrent
                    ? C.accentSoft
                    : "transparent",
                  transition: "all 0.2s",
                  opacity: isReviewed ? 0.6 : 1,
                }}
              >
                {/* Reasoning */}
                {revision.reasoning && isCurrent && (
                  <div style={{
                    fontSize: 12, fontStyle: "italic", color: C.textSec,
                    fontFamily: C.sans, marginBottom: 8, lineHeight: 1.5,
                  }}>
                    {revision.reasoning}
                  </div>
                )}

                {isUnchanged && isCurrent && (
                  <div style={{
                    fontSize: 11, fontFamily: C.sans, color: C.green,
                    marginBottom: 6, fontWeight: 500,
                  }}>
                    No changes needed
                  </div>
                )}

                <p style={{
                  fontFamily: C.serif, fontSize: 15, lineHeight: 1.8,
                  color: isUnchanged ? C.textMuted : C.text,
                  margin: 0, whiteSpace: "pre-wrap",
                }}>
                  {revision.text || ""}
                </p>

                {decisionLabel && (
                  <div style={{
                    fontSize: 10, fontFamily: C.sans, color: decisionLabel.color,
                    marginTop: 6, fontWeight: 500,
                  }}>
                    {decisionLabel.text}
                  </div>
                )}
              </div>
            );
          })}

          {/* Streaming partial indicator */}
          {isStreaming && hasRevisions && (
            <div style={{
              padding: "12px 16px", borderRadius: 8, marginBottom: 8,
              border: `1px dashed ${C.border}`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Loader size={12} color={C.textMuted} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: C.textMuted, fontFamily: C.sans }}>
                Reviewing remaining paragraphs...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Review control bar */}
      {hasRevisions && !isStreaming && !allDone && reviewIndex < total && (
        <div style={{
          padding: "16px 24px", borderTop: `1px solid ${C.border}`,
          background: C.bgComposer,
        }}>
          {isEditing ? (
            <div>
              <div style={{
                fontSize: 11, fontFamily: C.sans, color: C.accent,
                marginBottom: 8, fontWeight: 500,
              }}>
                Edit the suggested revision
              </div>
              <textarea
                ref={editTextareaRef}
                value={editText}
                onChange={e => {
                  setEditText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && e.metaKey) handleSaveEdit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                style={{
                  width: "100%", background: C.bgDeep,
                  border: `1px solid ${C.borderHover}`,
                  borderRadius: 8, padding: "12px 14px",
                  color: C.text, fontSize: 15,
                  fontFamily: C.serif, lineHeight: 1.8,
                  resize: "none", outline: "none", minHeight: 80,
                }}
              />
              <div style={{
                display: "flex", gap: 8, marginTop: 10,
                justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 11, color: C.textMuted, fontFamily: C.sans }}>
                  ⌘+Enter to save · Esc to cancel
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setIsEditing(false)} style={{
                    padding: "7px 14px", borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: "transparent", color: C.textMuted,
                    fontSize: 12, fontFamily: C.sans, cursor: "pointer",
                  }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} style={{
                    padding: "7px 14px", borderRadius: 6,
                    border: "none", background: C.blue, color: "#fff",
                    fontSize: 12, fontFamily: C.sans, cursor: "pointer",
                  }}>
                    Use this version
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              justifyContent: "center",
            }}>
              {revisions[reviewIndex]?.status === "unchanged" ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, fontFamily: C.sans, color: C.textSec,
                }}>
                  <Check size={14} color={C.green} />
                  No changes needed —
                  <button onClick={() => onAcceptRevision(reviewIndex)} style={{
                    background: "transparent", border: "none",
                    color: C.accent, fontSize: 13, fontFamily: C.sans,
                    cursor: "pointer", textDecoration: "underline",
                  }}>
                    Continue
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => onAcceptRevision(reviewIndex)} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 18px", borderRadius: C.radiusPill,
                    border: "none", background: C.green, color: "#fff",
                    fontSize: 13, fontFamily: C.sans, fontWeight: 500,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
                  onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                    <Check size={14} /> Accept revision
                  </button>

                  <button onClick={() => onRejectRevision(reviewIndex)} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 18px", borderRadius: C.radiusPill,
                    border: `1px solid ${C.border}`, background: "transparent",
                    color: C.textMuted, fontSize: 13, fontFamily: C.sans,
                    fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
                    <X size={14} /> Keep original
                  </button>

                  <button onClick={handleEdit} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 18px", borderRadius: C.radiusPill,
                    border: `1px solid ${C.border}`, background: "transparent",
                    color: C.textSec, fontSize: 13, fontFamily: C.sans,
                    fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}>
                    <PenLine size={14} /> Edit
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assemble button */}
      {allDone && (
        <div style={{
          padding: "16px 24px", borderTop: `1px solid ${C.border}`,
          background: C.bgComposer, display: "flex", justifyContent: "center",
        }}>
          <button onClick={onAssemble} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 24px", borderRadius: C.radiusPill,
            border: "none", background: C.accent, color: "#fff",
            fontSize: 14, fontFamily: C.sans, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
          onMouseOut={e => e.currentTarget.style.opacity = "1"}>
            <Check size={16} /> Assemble final document <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
