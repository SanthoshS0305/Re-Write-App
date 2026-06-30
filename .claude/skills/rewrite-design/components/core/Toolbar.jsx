import React from "react";

/**
 * The formatting-toolbar pill: a raised teal rounded bar that holds IconButtons.
 */
export function Toolbar({ children, style = {}, ...props }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        backgroundColor: "var(--rw-surface-raised)",
        borderRadius: "var(--rw-radius-pill)",
        padding: "12px 20px",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
