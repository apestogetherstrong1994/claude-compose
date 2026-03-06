"use client";

import { C } from "../design-system";

export function StreamingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: C.accent,
          animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}
