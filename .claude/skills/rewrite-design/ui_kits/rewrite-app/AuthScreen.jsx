// AuthScreen — Re:Write login over the forest backdrop.
function AuthScreen({ onLogin }) {
  const { Logo, Input, Button } = window.ReWriteDesignSystem_e1e021;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "var(--rw-dark-mint-green)" }} />
      <img src="../../assets/forest_bg.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", gap: 12, fontFamily: "var(--rw-font-display)", fontSize: 52, lineHeight: 1.2, textAlign: "center" }}>
          <span style={{ color: "var(--rw-aqua)" }}>Hello, Author,</span>
          <span style={{ color: "var(--rw-light-gray)" }}>Welcome back to</span>
        </div>

        <div style={{ backgroundColor: "var(--rw-dark-green)", borderRadius: "var(--rw-radius-card)", boxShadow: "var(--rw-shadow-card)", padding: "36px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: 380 }}>
          <Logo size={76} />
          <Input placeholder="Email" defaultValue="author@rewrite.app" />
          <Input placeholder="Password" type="password" defaultValue="••••••••" />
          <Button variant="primary" size="lg" onClick={onLogin} style={{ marginTop: 4 }}>Login</Button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", color: "var(--rw-light-gray)", opacity: 0.5, fontFamily: "var(--rw-font-display)", fontSize: 14 }}>
            <div style={{ flex: 1, height: 1, background: "currentColor" }} /> OR <div style={{ flex: 1, height: 1, background: "currentColor" }} />
          </div>
          <button onClick={onLogin} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#fff", border: "3px solid #000", borderRadius: "var(--rw-radius-pill)", fontFamily: "var(--rw-font-display)", fontSize: 20, padding: "10px 22px", cursor: "pointer", color: "#000" }}>
            <window.RWIcon name="globe" size={22} /> Continue with Google
          </button>
          <div style={{ fontFamily: "var(--rw-font-display)", fontSize: 20, display: "flex", gap: 8 }}>
            <span style={{ color: "var(--rw-light-gray)" }}>No Account?</span>
            <span style={{ color: "var(--rw-green-lowlight)", cursor: "pointer" }} onClick={onLogin}>Create One</span>
          </div>
        </div>
      </div>
    </div>
  );
}
window.AuthScreen = AuthScreen;
