import React from "react";

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * Raised-teal rounded toolbar pill that holds formatting IconButtons.
 * @startingPoint section="Core" subtitle="Formatting toolbar pill" viewport="700x110"
 */
export function Toolbar(props: ToolbarProps): JSX.Element;
