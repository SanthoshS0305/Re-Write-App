import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "primary" */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}

/**
 * Re:Write pill button — Joan serif, generous rounding.
 * Primary actions get the green fill + hard black border.
 * @startingPoint section="Core" subtitle="Pill buttons in all variants" viewport="700x160"
 */
export function Button(props: ButtonProps): JSX.Element;
