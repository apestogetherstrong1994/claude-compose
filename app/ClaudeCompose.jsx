"use client";

import { useState, useRef, useCallback } from "react";
import { C } from "@/components/design-system";
import { TopBar } from "@/components/layout/TopBar";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";
import { QuestionOverlay } from "@/components/questions/QuestionOverlay";
import { DocumentPanel } from "@/components/document/DocumentPanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { LeftSidebar } from "@/components/sidebar/LeftSidebar";
import { ClaudeLogo } from "@/components/icons/ClaudeLogo";
import { parseProposals, parseVoiceProfile, stripStructuredBlocks } from "@/lib/proposal-parser";

// ─── Calibration Questions ─────────────────────────────────────────
const CALIBRATION_QUESTIONS = [
  {
    title: "What kind of writing is this?",
    description: "This helps me calibrate my voice and suggestions.",
    options: [
      { label: "Essay", description: "Persuasive, analytical, or personal" },
      { label: "Cover letter", description: "Professional, targeted, authentic" },
      { label: "Fiction", description: "Short story, novel opening, creative" },
      { label: "Email or memo", description: "Clear, concise, purposeful" },
    ],
  },
  {
    title: "How should we work together?",
    description: "I can adapt my style to what works best for you.",
    options: [
      { label: "Guide me through it", description: "I'll ask questions and help you structure your thoughts" },
      { label: "Let me write, then suggest", description: "I'll watch and offer proposals when you pause" },
      { label: "Build it paragraph by paragraph", description: "We'll take turns proposing and refining" },
    ],
  },
];

// ─── Generate unique IDs ───────────────────────────────────────────
let blockCounter = 0;
const genId = () => `${++blockCounter}`;

export default function ClaudeCompose() {
  // ─── App state ─────────────────────────────────────────────────────
  const [phase, setPhase] = useState("welcome"); // welcome | calibrating | composing
  const [taskType, setTaskType] = useState(null);
  const [calibration, setCalibration] = useState({});
  const [calibrationIndex, setCalibrationIndex] = useState(0);

  // ─── Document state ────────────────────────────────────────────────
  const [blocks, setBlocks] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [streamingProposal, setStreamingProposal] = useState(null);

  // ─── Chat state ────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  // ─── Voice profile ─────────────────────────────────────────────────
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastAnalyzedCount = useRef(0);

  // ─── Auto-suggest state ──────────────────────────────────────────
  const [justSavedBlockId, setJustSavedBlockId] = useState(null);
  const [nextSuggestion, setNextSuggestion] = useState(null);
  const [isSuggestingNext, setIsSuggestingNext] = useState(false);
  const [editPreviousDepth, setEditPreviousDepth] = useState(0);
  const suggestAbortRef = useRef(null);

  // ─── Welcome input ─────────────────────────────────────────────────
  const [welcomeInput, setWelcomeInput] = useState("");

  // ═══════════════════════════════════════════════════════════════════
  // STREAMING
  // ═══════════════════════════════════════════════════════════════════
  const streamMessage = useCallback(async (userMessage, existingMessages = []) => {
    setIsStreaming(true);
    const newMessages = [...existingMessages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    let fullText = "";
    let currentStreamingProposal = null;

    // Add placeholder assistant message
    const assistantMsg = { role: "assistant", content: "", displayContent: "" };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...newMessages],
          documentBlocks: blocks,
          voiceProfile,
          calibration,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const event = JSON.parse(data);
            if (event.type === "text") {
              fullText += event.text;

              // Check for streaming proposal
              const proposalStart = fullText.lastIndexOf("[PROPOSAL]");
              const proposalEnd = fullText.lastIndexOf("[/PROPOSAL]");

              if (proposalStart !== -1 && proposalEnd === -1) {
                // We're inside a streaming proposal
                const partial = fullText.slice(proposalStart);
                const reasoningMatch = partial.match(/reasoning:\s*(.+)/);
                const textMatch = partial.match(/text:\s*([\s\S]*?)$/);
                const targetMatch = partial.match(/target:\s*(.+)/);
                const typeMatch = partial.match(/type:\s*(.+)/);

                currentStreamingProposal = {
                  reasoning: reasoningMatch ? reasoningMatch[1].trim() : "",
                  text: textMatch ? textMatch[1].trim() : "",
                  target: targetMatch ? targetMatch[1].trim() : "end",
                  type: typeMatch ? typeMatch[1].trim() : "new",
                };
                setStreamingProposal(currentStreamingProposal);
              } else if (proposalEnd > proposalStart) {
                // Proposal completed
                setStreamingProposal(null);
                const newProposals = parseProposals(fullText);
                if (newProposals.length > 0) {
                  setProposals(prev => {
                    const existingIds = new Set(prev.map(p => p.text));
                    const fresh = newProposals.filter(p => !existingIds.has(p.text));
                    return [...prev, ...fresh];
                  });
                }
              }

              // Check for voice profile
              const vpProfile = parseVoiceProfile(fullText);
              if (vpProfile) {
                setVoiceProfile(vpProfile);
              }

              // Update chat message with cleaned text
              const cleanText = stripStructuredBlocks(fullText);
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: fullText,
                  displayContent: cleanText,
                };
                return updated;
              });
            }
          } catch (e) {
            // Skip parse errors for partial chunks
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Stream error:", err);
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              displayContent: "Something went wrong. Please try again.",
            };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingProposal(null);
    }
  }, [blocks, voiceProfile, calibration]);

  // ═══════════════════════════════════════════════════════════════════
  // VOICE PROFILE ANALYSIS
  // ═══════════════════════════════════════════════════════════════════
  const analyzeVoice = useCallback(async () => {
    const humanBlocks = blocks.filter(b => b.author === "human" && b.status === "accepted");
    if (humanBlocks.length < 2 || humanBlocks.length <= lastAnalyzedCount.current) return;

    setIsAnalyzing(true);
    lastAnalyzedCount.current = humanBlocks.length;

    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Analyze the voice and style of these paragraphs I've written. Generate a [VOICE_PROFILE] block.\n\n${humanBlocks.map(b => b.text).join("\n\n")}`,
          }],
          documentBlocks: blocks,
          voiceProfile: null,
          calibration,
        }),
      });

      if (!res.ok) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const event = JSON.parse(data);
            if (event.type === "text") text += event.text;
          } catch (e) {}
        }
      }

      const profile = parseVoiceProfile(text);
      if (profile) setVoiceProfile(profile);
    } catch (err) {
      console.error("Voice analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [blocks, calibration]);

  // ═══════════════════════════════════════════════════════════════════
  // AUTO-SUGGEST: Background fetch for next paragraph
  // ═══════════════════════════════════════════════════════════════════
  const fetchNextSuggestion = useCallback(async (currentBlocks) => {
    if (suggestAbortRef.current) suggestAbortRef.current.abort();
    setIsSuggestingNext(true);
    setNextSuggestion(null);

    try {
      suggestAbortRef.current = new AbortController();
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `The author just added a new paragraph to the document. Based on the document's flow, voice, and direction, suggest what paragraph should come next. Respond with ONLY a [PROPOSAL] block targeting the end of the document. Keep it to a single paragraph that continues the natural flow.`,
          }],
          documentBlocks: currentBlocks,
          voiceProfile,
          calibration,
        }),
        signal: suggestAbortRef.current.signal,
      });

      if (!res.ok) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const event = JSON.parse(data);
            if (event.type === "text") text += event.text;
          } catch (e) {}
        }
      }

      const parsed = parseProposals(text);
      if (parsed.length > 0 && parsed[0].text) {
        setNextSuggestion(parsed[0].text);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Suggestion fetch error:", err);
      }
    } finally {
      setIsSuggestingNext(false);
    }
  }, [voiceProfile, calibration]);

  const clearPostSaveState = useCallback(() => {
    setJustSavedBlockId(null);
    setEditPreviousDepth(0);
    if (suggestAbortRef.current) suggestAbortRef.current.abort();
  }, []);

  const handleStartNextParagraph = useCallback(() => {
    const suggestion = nextSuggestion || "";
    clearPostSaveState();
    return suggestion;
  }, [nextSuggestion, clearPostSaveState]);

  const handleEditPrevious = useCallback(() => {
    const acceptedBlocks = blocks.filter(b => b.status === "accepted");
    if (acceptedBlocks.length === 0) return undefined;

    const newDepth = editPreviousDepth + 1;
    const targetIndex = acceptedBlocks.length - newDepth;
    if (targetIndex < 0) return undefined;

    setEditPreviousDepth(newDepth);
    const targetBlockId = acceptedBlocks[targetIndex].id;
    return targetBlockId;
  }, [blocks, editPreviousDepth]);

  // ═══════════════════════════════════════════════════════════════════
  // DOCUMENT OPERATIONS
  // ═══════════════════════════════════════════════════════════════════
  const addBlock = (text, afterId, author = "human") => {
    const newBlock = {
      id: genId(),
      text,
      author,
      status: "accepted",
      reasoning: null,
    };

    // Compute the new blocks array synchronously for use in background fetch
    const computeNewBlocks = (prev) => {
      if (afterId === "start" || prev.length === 0) {
        return [newBlock, ...prev];
      }
      const idx = prev.findIndex(b => b.id === afterId);
      if (idx === -1) return [...prev, newBlock];
      return [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)];
    };

    const updatedBlocks = computeNewBlocks(blocks);
    setBlocks(computeNewBlocks);

    // Trigger post-save flow: hint bar + auto-suggest
    setJustSavedBlockId(newBlock.id);
    setEditPreviousDepth(0);
    setNextSuggestion(null);

    // Fetch next suggestion in background
    setTimeout(() => {
      fetchNextSuggestion(updatedBlocks);
    }, 100);

    // Trigger voice analysis after 2+ human blocks
    const humanCount = updatedBlocks.filter(b => b.author === "human").length;
    if (humanCount >= 2 && humanCount > lastAnalyzedCount.current) {
      setTimeout(() => analyzeVoice(), 500);
    }
  };

  const updateBlock = (id, text) => {
    setBlocks(prev => prev.map(b =>
      b.id === id ? { ...b, text, author: "human" } : b
    ));
  };

  const deleteBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const acceptProposal = (proposal) => {
    const newBlock = {
      id: genId(),
      text: proposal.text,
      author: "claude",
      status: "accepted",
      reasoning: proposal.reasoning,
    };

    setBlocks(prev => {
      if (proposal.target && proposal.target.startsWith("replace_block_")) {
        const targetId = proposal.target.replace("replace_block_", "");
        return prev.map(b => b.id === targetId ? { ...newBlock, id: b.id } : b);
      }
      if (proposal.target && proposal.target.startsWith("after_block_")) {
        const targetId = proposal.target.replace("after_block_", "");
        const idx = prev.findIndex(b => b.id === targetId);
        if (idx !== -1) return [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)];
      }
      return [...prev, newBlock];
    });

    setProposals(prev => prev.filter(p => p !== proposal));
  };

  const rejectProposal = (proposal) => {
    setProposals(prev => prev.filter(p => p !== proposal));
  };

  const riffProposal = (proposal, text) => {
    const newBlock = {
      id: genId(),
      text,
      author: "collaborative",
      status: "accepted",
      reasoning: proposal.reasoning,
    };

    setBlocks(prev => {
      if (proposal.target && proposal.target.startsWith("after_block_")) {
        const targetId = proposal.target.replace("after_block_", "");
        const idx = prev.findIndex(b => b.id === targetId);
        if (idx !== -1) return [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)];
      }
      return [...prev, newBlock];
    });

    setProposals(prev => prev.filter(p => p !== proposal));
  };

  // ═══════════════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════════════
  const handleChatSend = (text) => {
    streamMessage(text, messages);
  };

  // ═══════════════════════════════════════════════════════════════════
  // WELCOME & CALIBRATION
  // ═══════════════════════════════════════════════════════════════════
  const handleTaskCard = (type) => {
    setTaskType(type);
    setPhase("calibrating");
    setCalibrationIndex(0);
    setCalibration({});
  };

  const handleWelcomeSubmit = (text) => {
    setTaskType("freeform");
    setPhase("calibrating");
    setCalibrationIndex(0);
    setCalibration({ initialText: text });
  };

  const handleCalibrationSelect = (answer) => {
    const questionTitle = CALIBRATION_QUESTIONS[calibrationIndex].title;
    setCalibration(prev => ({ ...prev, [questionTitle]: answer }));

    if (calibrationIndex < CALIBRATION_QUESTIONS.length - 1) {
      setCalibrationIndex(calibrationIndex + 1);
    } else {
      finishCalibration({ ...calibration, [questionTitle]: answer });
    }
  };

  const handleCalibrationSkip = () => {
    if (calibrationIndex < CALIBRATION_QUESTIONS.length - 1) {
      setCalibrationIndex(calibrationIndex + 1);
    } else {
      finishCalibration(calibration);
    }
  };

  const finishCalibration = (finalCalibration) => {
    setCalibration(finalCalibration);
    setPhase("composing");

    // Build initial message based on task type and calibration
    let initialPrompt = "";
    const writingType = finalCalibration["What kind of writing is this?"] || "general writing";
    const workStyle = finalCalibration["How should we work together?"] || "Build it paragraph by paragraph";

    if (taskType === "continue" || finalCalibration.initialText) {
      const text = finalCalibration.initialText || "";
      if (text) {
        // User pasted text — add as initial blocks
        const paragraphs = text.split(/\n\n+/).filter(Boolean);
        const newBlocks = paragraphs.map(p => ({
          id: genId(),
          text: p.trim(),
          author: "human",
          status: "accepted",
          reasoning: null,
        }));
        setBlocks(newBlocks);
        initialPrompt = `I've started a ${writingType} piece. I've written ${paragraphs.length} paragraph${paragraphs.length > 1 ? "s" : ""}. Read what I have and tell me what you notice about my voice and where this could go next. My preferred collaboration style: ${workStyle}`;
      } else {
        initialPrompt = `I want to continue a ${writingType} piece. I'll paste my draft into the document panel. My preferred collaboration style: ${workStyle}`;
      }
    } else if (taskType === "spark") {
      initialPrompt = `I want to start a new ${writingType} piece from scratch. Help me figure out what I want to say. Ask me one good question to get started. My preferred collaboration style: ${workStyle}`;
    } else if (taskType === "polish") {
      initialPrompt = `I have a ${writingType} piece that needs polishing. I'll add it to the document, and I'd like you to review it and suggest specific improvements. My preferred collaboration style: ${workStyle}`;
    } else {
      initialPrompt = `I'd like to co-write a ${writingType} piece with you. My preferred collaboration style: ${workStyle}. Let's begin — ask me one question to get started.`;
    }

    streamMessage(initialPrompt, []);
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: C.bg, color: C.text, fontFamily: C.sans,
      backgroundImage: C.grid, backgroundSize: "60px 60px",
    }}>
      <TopBar />

      {/* Welcome phase */}
      {phase === "welcome" && (
        <WelcomeScreen
          welcomeInput={welcomeInput}
          setWelcomeInput={setWelcomeInput}
          onSubmit={handleWelcomeSubmit}
          onTaskCard={handleTaskCard}
        />
      )}

      {/* Calibration phase */}
      {phase === "calibrating" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "0 32px", maxWidth: 600, margin: "0 auto", width: "100%",
        }}>
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <ClaudeLogo size={32} />
            <div style={{
              fontFamily: C.serif, fontStyle: "italic", fontSize: 20,
              color: C.textSec, marginTop: 12,
            }}>
              Let me get to know your project
            </div>
          </div>
          <QuestionOverlay
            question={CALIBRATION_QUESTIONS[calibrationIndex]}
            questionIndex={calibrationIndex}
            totalQuestions={CALIBRATION_QUESTIONS.length}
            onSelect={handleCalibrationSelect}
            onSkip={handleCalibrationSkip}
          />
        </div>
      )}

      {/* Composing phase — three-panel layout */}
      {phase === "composing" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <LeftSidebar
            blocks={blocks}
            voiceProfile={voiceProfile}
            isAnalyzing={isAnalyzing}
          />
          <DocumentPanel
            blocks={blocks}
            proposals={proposals}
            streamingProposal={streamingProposal}
            onAddBlock={addBlock}
            onUpdateBlock={updateBlock}
            onDeleteBlock={deleteBlock}
            onAcceptProposal={acceptProposal}
            onRejectProposal={rejectProposal}
            onRiffProposal={riffProposal}
            justSavedBlockId={justSavedBlockId}
            nextSuggestion={nextSuggestion}
            isSuggestingNext={isSuggestingNext}
            onStartNextParagraph={handleStartNextParagraph}
            onEditPrevious={handleEditPrevious}
            onClearPostSave={clearPostSaveState}
          />
          <ChatPanel
            messages={messages}
            input={chatInput}
            setInput={setChatInput}
            onSend={handleChatSend}
            isStreaming={isStreaming}
          />
        </div>
      )}
    </div>
  );
}
