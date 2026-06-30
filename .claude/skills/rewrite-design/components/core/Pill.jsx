import React from "react";

/**
 * The chapter-name pill from the editor header: mint-green, white border, big rounding.
 * Also serves as a generic value pill.
 */
export function Pill({ children, style = {}, ...props }) {
  return (
    <span
      style={{
        fontFamily: "var(--rw-font-display)",
        backgroundColor: "var(--rw-mint-green)",
        border: "1px solid var(--rw-white)",
        borderRadius: "var(--rw-radius-input)",
        color: "var(--rw-black)",
        fontSize: 18,
        padding: "6px 14px",
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
