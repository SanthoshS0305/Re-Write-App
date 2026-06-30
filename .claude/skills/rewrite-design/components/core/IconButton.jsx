import React from "react";

/**
 * Toolbar icon button. Transparent; dims to 0.45 opacity when `active`.
 * Pass an icon node (e.g. a Lucide icon) as children.
 */
export function IconButton({ active = false, children, style = {}, ...props }) {
  return (
    <button
      type="button"
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        opacity: active ? 0.45 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--rw-white)",
        transition: "opacity var(--rw-dur-fast)",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
