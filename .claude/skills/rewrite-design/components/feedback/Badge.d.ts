import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default "aqua" */
  tone?: "aqua" | "mint" | "neutral" | "danger";
  children?: React.ReactNode;
}

/**
 * Small rounded status badge in the Re:Write palette.
 * @startingPoint section="Feedback" subtitle="Status badges" viewport="700x90"
 */
export function Badge(props: BadgeProps): JSX.Element;
