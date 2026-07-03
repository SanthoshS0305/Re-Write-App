import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show the aqua top hairline accent. @default false */
  accent?: boolean;
  children?: React.ReactNode;
}

/**
 * Dark-green surface card with the signature soft drop shadow.
 * @startingPoint section="Core" subtitle="Surface card with optional accent" viewport="700x200"
 */
export function Card(props: CardProps): JSX.Element;
