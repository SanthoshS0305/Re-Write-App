import React from "react";

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
}

/**
 * Mint-green value pill — the chapter-name chip from the editor header.
 * @startingPoint section="Core" subtitle="Mint value pill" viewport="700x100"
 */
export function Pill(props: PillProps): JSX.Element;
