import React from "react";

/**
 * Small status/label badge. tones: aqua (default), mint, neutral, danger.
 */
export function Badge({ tone = "aqua", children, style = {}, ...props }) {
  const tones = {
    aqua: { background: "rgba(63,208,201,0.15)", color: "var(--rw-aqua)" },
    mint: { background: "var(--rw-mint-green)", color: "var(--rw-black)" },
    neutral: { background: "var(--rw-surface-raised)", color: "var(--rw-light-gray)" },
    danger: { background: "rgba(192,57,43,0.18)", color: "#e3796c" },
  };
  return (
    <span
      style={{
        fontFamily: "var(--rw-font-display)",
        fontSize: 13,
        padding: "3px 12px",
        borderRadius: "var(--rw-radius-round)",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        lineHeight: 1.3,
        ...tones[tone],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
