import React from "react";

/**
 * Re:Write primary button. Big rounded pill, hard black border, Joan serif.
 * variants: primary (green), secondary (raised teal), ghost (text), danger.
 */
export function Button({
  variant = "primary",
  size = "md",
  children,
  style = {},
  ...props
}) {
  const sizes = {
    sm: { fontSize: 16, padding: "8px 18px" },
    md: { fontSize: 20, padding: "12px 28px" },
    lg: { fontSize: 36, padding: "8px 40px" },
  };

  const base = {
    fontFamily: "var(--rw-font-display)",
    cursor: "pointer",
    borderRadius: "var(--rw-radius-pill)",
    transition: "opacity var(--rw-dur-fast) var(--rw-ease)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    lineHeight: 1,
    ...sizes[size],
  };

  const hardBorder = "var(--rw-border-width) solid var(--rw-border-hard)";
  const variants = {
    primary: {
      backgroundColor: "var(--rw-action)",
      color: "var(--rw-black)",
      border: hardBorder,
    },
    secondary: {
      backgroundColor: "var(--rw-surface-raised)",
      color: "var(--rw-white)",
      border: hardBorder,
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--rw-text)",
      border: hardBorder,
    },
    danger: {
      backgroundColor: "var(--rw-danger)",
      color: "var(--rw-white)",
      border: hardBorder,
    },
  };

  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      {...props}
    >
      {children}
    </button>
  );
}
