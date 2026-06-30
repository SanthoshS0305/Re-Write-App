import React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Active/pressed formatting state — dims to 0.45. @default false */
  active?: boolean;
  /** Icon node (e.g. a Lucide icon). */
  children?: React.ReactNode;
}

/**
 * Transparent white toolbar icon button; dims when active.
 * @startingPoint section="Core" subtitle="Toolbar icon button" viewport="700x100"
 */
export function IconButton(props: IconButtonProps): JSX.Element;
