import React from "react";

export interface SidePanelProps {
  open?: boolean;
  title: string;
  onClose?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Right-docked sliding panel used for Scene Manager and Version History.
 * @startingPoint section="Editor" subtitle="Docked side panel" viewport="700x320"
 */
export function SidePanel(props: SidePanelProps): JSX.Element;
