import React from "react";

/**
 * Dark-green surface card with the signature soft drop shadow.
 * `accent` adds the aqua top hairline used on story cards.
 */
export function Card({ accent = false, children, style = {}, ...props }) {
  return (
    <div
      style={{
        backgroundColor: "var(--rw-surface)",
        borderRadius: "var(--rw-radius-card)",
        boxShadow: "var(--rw-shadow-card)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
      {...props}
    >
      {accent && (
        <div style={{ height: 4, width: "100%", backgroundColor: "var(--rw-aqua)" }} />
      )}
      {children}
    </div>
  );
}
