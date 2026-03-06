"use client";

import { C } from "../design-system";

export function TopBar() {
  return (
    <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 2, background: C.bgComposer, borderRadius: 10, padding: 3, border: `0.5px solid ${C.border}` }}>
        {["Code", "Cowork", "Chat", "Compose"].map(mode => {
          const isActive = mode === "Compose";
          const isDisabled = mode !== "Compose";
          return (
            <button key={mode}
              disabled={isDisabled}
              style={{
                padding: "5px 16px",
                borderRadius: 8,
                border: "none",
                background: isActive ? C.bg : "transparent",
                color: isActive ? C.text : C.textMuted,
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                fontFamily: C.sans,
                cursor: isDisabled ? "default" : "pointer",
                opacity: isDisabled ? 0.4 : 1,
                transition: "all 0.15s",
                boxShadow: isActive ? C.shadowSoft : "none",
                letterSpacing: 0.1,
              }}>
              {mode}
            </button>
          );
        })}
      </div>
    </div>
  );
}
