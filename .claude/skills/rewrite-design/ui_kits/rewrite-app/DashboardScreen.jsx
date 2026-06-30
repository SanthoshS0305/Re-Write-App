// DashboardScreen — "Your Stories" grid.
function DashboardScreen({ onOpenStory, onSignOut }) {
  const { Logo, Button, StoryCard } = window.ReWriteDesignSystem_e1e021;
  const stories = [
    { title: "The Lighthouse", chapters: 4, updated: "Jun 12, 2026" },
    { title: "Salt & Cedar", chapters: 2, updated: "May 30, 2026" },
    { title: "The Quiet Coast", chapters: 7, updated: "May 18, 2026" },
    { title: "Untitled Draft", chapters: 1, updated: "Apr 02, 2026" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "auto" }}>
      <div style={{ position: "fixed", inset: 0, backgroundColor: "var(--rw-dark-mint-green)", zIndex: 0 }} />
      <img src="../../assets/forest_bg.jpg" alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4, zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100%", display: "flex", flexDirection: "column" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", minHeight: 80, backgroundColor: "var(--rw-dark-green)", boxShadow: "var(--rw-shadow-card)" }}>
          <Logo size={44} short />
          <div style={{ flex: 1 }} />
          <Button variant="secondary" size="sm" style={{ gap: 8 }}><window.RWIcon name="upload" size={16} /> Import</Button>
          <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--rw-font-display)", fontSize: 18, color: "var(--rw-light-gray)" }}>
            <window.RWIcon name="log-out" size={16} /> Sign Out
          </button>
        </header>

        <main style={{ flex: 1, padding: "40px 48px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36 }}>
            <div>
              <p style={{ fontFamily: "var(--rw-font-display)", fontSize: 20, color: "var(--rw-aqua)", margin: "0 0 4px" }}>Hello, Author,</p>
              <h2 style={{ fontFamily: "var(--rw-font-display)", fontSize: 56, lineHeight: 1, color: "var(--rw-light-gray)", margin: 0 }}>Your Stories</h2>
            </div>
            <Button variant="primary" style={{ gap: 8 }}><window.RWIcon name="plus" size={18} /> New Story</Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 880 }}>
            {stories.map((s) => (
              <StoryCard key={s.title} {...s} onClick={() => onOpenStory(s)} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
window.DashboardScreen = DashboardScreen;
