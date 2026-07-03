import React from "react";

/**
 * Re:Write text input. Mint-green fill, hard black border, big rounding, Joan serif.
 */
export function Input({ style = {}, ...props }) {
  return (
    <input
      style={{
        fontFamily: "var(--rw-font-display)",
        backgroundColor: "var(--rw-input-bg)",
        border: "var(--rw-border-width) solid var(--rw-border-hard)",
        borderRadius: "var(--rw-radius-input)",
        fontSize: 24,
        color: "var(--rw-text-on-light)",
        padding: "10px 20px",
        outline: "none",
        width: "100%",
        ...style,
      }}
      {...props}
    />
  );
}
