import React from "react";

export interface LogoProps {
  /** Font size in px. @default 96 */
  size?: number;
  /** Render just "Re:" for compact headers. @default false */
  short?: boolean;
  style?: React.CSSProperties;
}

/**
 * Re:Write wordmark — "Re" aqua, colon mint (contrasts dark surfaces), "Write" light gray.
 * @startingPoint section="Brand" subtitle="The Re:Write wordmark" viewport="700x140"
 */
export function Logo(props: LogoProps): JSX.Element;
