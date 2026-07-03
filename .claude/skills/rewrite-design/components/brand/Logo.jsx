import React from "react";

/**
 * The Re:Write wordmark. "Re" in aqua, the colon always black, "Write" in light gray.
 * size = font-size in px. `short` renders just "Re:" (used in compact headers).
 */
export function Logo({ size = 96, short = false, style = {} }) {
  return (
    <span
      style={{
        fontFamily: "var(--rw-font-display)",
        fontSize: size,
        lineHeight: 1,
        whiteSpace: "nowrap",
        display: "inline-flex",
        ...style,
      }}
    >
      <span style={{ color: "var(--rw-aqua)" }}>Re</span>
      <span style={{ color: "var(--rw-mint-green)" }}>:</span>
      {!short && <span style={{ color: "var(--rw-light-gray)" }}>Write</span>}
    </span>
  );
}
