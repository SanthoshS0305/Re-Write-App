import React from "react";

/**
 * Right-docked side panel (Scene Manager / Version History). Slides in from the right.
 */
export function SidePanel({ open = true, title, onClose, children, style = {} }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 640,
        backgroundColor: "var(--rw-surface)",
        borderLeft: "1px solid var(--rw-border-soft)",
        boxShadow: "var(--rw-shadow-panel)",
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform var(--rw-dur) var(--rw-ease)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid var(--rw-border-soft)",
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontFamily: "var(--rw-font-display)", fontSize: 20, color: "var(--rw-light-gray)", margin: 0 }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rw-light-gray)", opacity: 0.7, fontSize: 18, lineHeight: 1 }}
        >
          ✕
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
    </div>
  );
}
