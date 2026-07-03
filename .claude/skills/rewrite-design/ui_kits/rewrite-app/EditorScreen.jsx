// EditorScreen — the writing surface with toolbar, scene marks, and a side panel.
function EditorScreen({ story, onBack }) {
  const { Logo, Pill, Toolbar, IconButton, Button, SceneMark, SidePanel, Badge } = window.ReWriteDesignSystem_e1e021;
  const [panel, setPanel] = React.useState(null); // null | 'scenes' | 'versions'
  const [activeScene, setActiveScene] = React.useState(0);
  const Icon = window.RWIcon;

  const scenes = [
    { label: "Arrival at the bay", versions: 3 },
    { label: "The keeper's letter", versions: 2 },
    { label: "Dawn on the cliff", versions: 1 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "var(--rw-dark-mint-green)" }} />
      <img src="../../assets/forest_bg.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 14, padding: "0 14px", minHeight: 100, backgroundColor: "var(--rw-dark-green)", boxShadow: "var(--rw-shadow-card)" }}>
        <img src="../../assets/icon.png" alt="Re:Write" onClick={onBack} style={{ height: 72, width: 72, borderRadius: 14, cursor: "pointer" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Pill>{story ? story.title : "Chapter One"}</Pill>
          <div style={{ display: "flex", gap: 12, alignItems: "center", fontFamily: "var(--rw-font-display)", fontSize: 16, color: "#fff" }}>
            <span onClick={onBack} style={{ color: "var(--rw-aqua)", cursor: "pointer" }}>{story ? story.title : "The Lighthouse"}</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span style={{ cursor: "pointer" }}>File</span>
            <span style={{ cursor: "pointer" }} onClick={() => setPanel("scenes")}>Scenes</span>
            <span style={{ cursor: "pointer" }} onClick={() => setPanel("versions")}>Versions</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
          <Toolbar style={{ gap: 20 }}>
            <IconButton active><Icon name="bold" /></IconButton>
            <IconButton><Icon name="italic" /></IconButton>
            <IconButton><Icon name="underline" /></IconButton>
            <IconButton><Icon name="heading-1" /></IconButton>
            <IconButton><Icon name="list" /></IconButton>
            <IconButton><Icon name="link" /></IconButton>
            <IconButton style={{ marginLeft: 8 }}><Icon name="undo-2" /></IconButton>
            <IconButton><Icon name="redo-2" /></IconButton>
          </Toolbar>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="sm" onClick={() => setPanel("scenes")}>Scene Manager</Button>
          <Button variant="secondary" size="sm" onClick={() => setPanel("versions")}>Version History</Button>
        </div>
      </header>

      {/* Canvas + panel */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <main style={{ position: "absolute", inset: 0, overflowY: "auto", display: "flex", justifyContent: "center", padding: "40px 30px", marginRight: panel ? 560 : 0, transition: "margin-right var(--rw-dur)" }}>
          <div style={{ width: 760, alignSelf: "flex-start", background: "rgba(255,255,255,0.94)", borderRadius: 16, boxShadow: "var(--rw-shadow-canvas)", padding: "64px 72px", minHeight: 700 }}>
            <h1 style={{ fontFamily: "var(--rw-font-display)", fontSize: 40, color: "#111", margin: "0 0 28px" }}>Chapter One</h1>
            <div style={{ fontFamily: "var(--rw-font-body)", fontSize: 20, lineHeight: 1.8, color: "#1a1a1a", display: "flex", flexDirection: "column", gap: 20 }}>
              <SceneMark active={activeScene === 0}>
                <p style={{ margin: 0 }}>
                  The harbor was quiet when she arrived. The lighthouse kept its lonely vigil over the bay, its beam sweeping the dark water in long, patient arcs. No one had lived in the keeper's cottage for years, and yet a single lamp still burned in the upper window.
                </p>
              </SceneMark>
              <SceneMark active={activeScene === 1}>
                <p style={{ margin: 0 }}>
                  She climbed the path slowly. The keeper's letter was still folded in her coat pocket, soft now from handling, its ink gone the color of weak tea. Every word of it she knew by heart.
                </p>
              </SceneMark>
              <SceneMark active={activeScene === 2}>
                <p style={{ margin: 0 }}>
                  By the time she reached the door, the sky had begun to pale. Dawn came grey and slow over the cliff, and the gulls woke one by one.
                </p>
              </SceneMark>
            </div>
          </div>
        </main>

        {/* Scene Manager panel */}
        {panel === "scenes" && (
          <SidePanel open title="Scene Manager" onClose={() => setPanel(null)} style={{ width: 560 }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", height: "100%" }}>
              <div style={{ borderRight: "1px solid var(--rw-border-soft)", overflowY: "auto" }}>
                {scenes.map((s, i) => (
                  <div key={s.label} onClick={() => setActiveScene(i)} style={{ padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.06)", background: i === activeScene ? "var(--rw-surface-raised)" : "transparent" }}>
                    <div style={{ fontFamily: "var(--rw-font-display)", fontSize: 16, color: "var(--rw-light-gray)" }}>{s.label}</div>
                    <div style={{ marginTop: 6 }}><Badge tone="aqua">{s.versions} versions</Badge></div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 18, overflowY: "auto" }}>
                <h3 style={{ fontFamily: "var(--rw-font-display)", fontSize: 18, color: "var(--rw-light-gray)", margin: "0 0 12px" }}>{scenes[activeScene].label}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["v3 · current", "v2 · 2 days ago", "v1 · original"].slice(0, scenes[activeScene].versions).map((v, i) => (
                    <div key={v} style={{ background: "var(--rw-surface-raised)", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--rw-font-display)", fontSize: 15, color: "var(--rw-light-gray)" }}>{v}</span>
                      {i === 0 ? <Badge tone="mint">Applied</Badge> : <Button variant="ghost" size="sm" style={{ fontSize: 14, color: "var(--rw-aqua)" }}>Apply</Button>}
                    </div>
                  ))}
                </div>
                <Button variant="primary" size="sm" style={{ marginTop: 18 }}>+ New Version</Button>
              </div>
            </div>
          </SidePanel>
        )}

        {panel === "versions" && (
          <SidePanel open title="Version History" onClose={() => setPanel(null)} style={{ width: 560 }}>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <Button variant="primary" size="sm" style={{ alignSelf: "flex-start" }}>Save Version</Button>
              {[
                { t: "Working draft", d: "Just now", cur: true },
                { t: "Before rewrite of opening", d: "Jun 11, 2026" },
                { t: "First complete pass", d: "Jun 03, 2026" },
              ].map((v) => (
                <div key={v.t} style={{ background: "var(--rw-surface-raised)", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "var(--rw-font-display)", fontSize: 16, color: "var(--rw-light-gray)" }}>{v.t}</div>
                    <div style={{ fontFamily: "var(--rw-font-sans)", fontSize: 12, color: "var(--rw-text-muted)", marginTop: 2 }}>{v.d}</div>
                  </div>
                  {v.cur ? <Badge tone="mint">Current</Badge> : <Button variant="ghost" size="sm" style={{ fontSize: 14, color: "var(--rw-aqua)" }}>Restore</Button>}
                </div>
              ))}
            </div>
          </SidePanel>
        )}
      </div>
    </div>
  );
}
window.EditorScreen = EditorScreen;
