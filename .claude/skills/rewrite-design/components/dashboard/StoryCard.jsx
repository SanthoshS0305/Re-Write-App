import React from "react";
import { Card } from "../core/Card.jsx";

/**
 * Dashboard story card: title, chapter count, last-updated meta, aqua accent.
 */
export function StoryCard({ title, chapters = 0, updated = "", onClick, style = {} }) {
  return (
    <Card
      accent
      onClick={onClick}
      style={{ cursor: "pointer", transition: "transform var(--rw-dur-fast)", ...style }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <h3
          style={{
            fontFamily: "var(--rw-font-display)",
            fontSize: 28,
            lineHeight: 1.1,
            color: "var(--rw-light-gray)",
            margin: 0,
          }}
        >
          {title}
        </h3>
        <div
          style={{
            fontFamily: "var(--rw-font-display)",
            fontSize: 16,
            display: "flex",
            gap: 12,
            color: "var(--rw-aqua)",
          }}
        >
          <span>{chapters} {chapters === 1 ? "chapter" : "chapters"}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ color: "var(--rw-light-gray)", opacity: 0.5 }}>{updated}</span>
        </div>
      </div>
    </Card>
  );
}
