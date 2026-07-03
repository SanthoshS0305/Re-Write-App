import React from "react";

/**
 * Block-level scene marker. Scenes group whole paragraph(s), so the marker is a
 * thick rail down the LEFT margin with decorative end markers (top + bottom)
 * — no fill. Quiet when idle, stronger when `active` (the scene being edited).
 */
export function SceneMark({ active = false, children, style = {}, ...props }) {
  const op = active ? 1 : 0.4;
  const railW = active ? 6 : 4;
  const dot = active ? 12 : 9;
  const marker = {
    position: "absolute",
    left: (railW - dot) / 2,
    width: dot,
    height: dot,
    background: "var(--rw-scene-marker)",
    borderRadius: "2px",
    transform: "rotate(45deg)",
    opacity: op,
    transition: "all var(--rw-dur-fast) var(--rw-ease)",
  };
  return (
    <div
      style={{ position: "relative", paddingLeft: 24, ...style }}
      {...props}
    >
      {/* left rail */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: dot / 2,
          bottom: dot / 2,
          width: railW,
          background: "var(--rw-scene-marker)",
          borderRadius: "2px",
          opacity: op,
          transition: "all var(--rw-dur-fast) var(--rw-ease)",
        }}
      />
      {/* decorated diamond end markers */}
      <span aria-hidden="true" style={{ ...marker, top: 0 }} />
      <span aria-hidden="true" style={{ ...marker, bottom: 0 }} />
      {children}
    </div>
  );
}
