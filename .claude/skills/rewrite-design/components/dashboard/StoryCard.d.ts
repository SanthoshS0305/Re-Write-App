import React from "react";

export interface StoryCardProps {
  title: string;
  chapters?: number;
  updated?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Dashboard story card with aqua accent, chapter count and last-updated meta.
 * @startingPoint section="Dashboard" subtitle="Story card" viewport="700x180"
 */
export function StoryCard(props: StoryCardProps): JSX.Element;
