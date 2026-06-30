import React from "react";

export interface SceneMarkProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The scene is being edited / selected — intensifies the marker. @default false */
  active?: boolean;
  children?: React.ReactNode;
}

/**
 * Block scene marker — a left-margin bracket around whole paragraph(s).
 * Quiet when idle, stronger when active.
 * @startingPoint section="Editor" subtitle="Paragraph scene bracket" viewport="700x200"
 */
export function SceneMark(props: SceneMarkProps): JSX.Element;
