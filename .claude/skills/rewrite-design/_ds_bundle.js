/* @ds-bundle: {"format":3,"namespace":"ReWriteDesignSystem_e1e021","components":[{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"Toolbar","sourcePath":"components/core/Toolbar.jsx"},{"name":"StoryCard","sourcePath":"components/dashboard/StoryCard.jsx"},{"name":"SceneMark","sourcePath":"components/editor/SceneMark.jsx"},{"name":"SidePanel","sourcePath":"components/editor/SidePanel.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"}],"sourceHashes":{"components/brand/Logo.jsx":"c4e75f3d1a4f","components/core/Button.jsx":"4fad119f5c8d","components/core/Card.jsx":"d07ae047c109","components/core/IconButton.jsx":"8d25ec901320","components/core/Pill.jsx":"46d7035f65f0","components/core/Toolbar.jsx":"08c698053141","components/dashboard/StoryCard.jsx":"ee7905385900","components/editor/SceneMark.jsx":"efc647ed438c","components/editor/SidePanel.jsx":"59d0b23779fa","components/feedback/Badge.jsx":"d239ffac6019","components/forms/Input.jsx":"552fbe68a0a6","ui_kits/rewrite-app/AuthScreen.jsx":"40d3c775dd58","ui_kits/rewrite-app/DashboardScreen.jsx":"4a941cd9720e","ui_kits/rewrite-app/EditorScreen.jsx":"8cbb4c68d77b","ui_kits/rewrite-app/icons.jsx":"894904eece33"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ReWriteDesignSystem_e1e021 = window.ReWriteDesignSystem_e1e021 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Logo.jsx
try { (() => {
/**
 * The Re:Write wordmark. "Re" in aqua, the colon always black, "Write" in light gray.
 * size = font-size in px. `short` renders just "Re:" (used in compact headers).
 */
function Logo({
  size = 96,
  short = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: size,
      lineHeight: 1,
      whiteSpace: "nowrap",
      display: "inline-flex",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--rw-aqua)"
    }
  }, "Re"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--rw-mint-green)"
    }
  }, ":"), !short && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--rw-light-gray)"
    }
  }, "Write"));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Re:Write primary button. Big rounded pill, hard black border, Joan serif.
 * variants: primary (green), secondary (raised teal), ghost (text), danger.
 */
function Button({
  variant = "primary",
  size = "md",
  children,
  style = {},
  ...props
}) {
  const sizes = {
    sm: {
      fontSize: 16,
      padding: "8px 18px"
    },
    md: {
      fontSize: 20,
      padding: "12px 28px"
    },
    lg: {
      fontSize: 36,
      padding: "8px 40px"
    }
  };
  const base = {
    fontFamily: "var(--rw-font-display)",
    cursor: "pointer",
    borderRadius: "var(--rw-radius-pill)",
    transition: "opacity var(--rw-dur-fast) var(--rw-ease)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    lineHeight: 1,
    ...sizes[size]
  };
  const hardBorder = "var(--rw-border-width) solid var(--rw-border-hard)";
  const variants = {
    primary: {
      backgroundColor: "var(--rw-action)",
      color: "var(--rw-black)",
      border: hardBorder
    },
    secondary: {
      backgroundColor: "var(--rw-surface-raised)",
      color: "var(--rw-white)",
      border: hardBorder
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--rw-text)",
      border: hardBorder
    },
    danger: {
      backgroundColor: "var(--rw-danger)",
      color: "var(--rw-white)",
      border: hardBorder
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    style: {
      ...base,
      ...variants[variant],
      ...style
    },
    onMouseEnter: e => e.currentTarget.style.opacity = "0.9",
    onMouseLeave: e => e.currentTarget.style.opacity = "1"
  }, props), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Dark-green surface card with the signature soft drop shadow.
 * `accent` adds the aqua top hairline used on story cards.
 */
function Card({
  accent = false,
  children,
  style = {},
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      backgroundColor: "var(--rw-surface)",
      borderRadius: "var(--rw-radius-card)",
      boxShadow: "var(--rw-shadow-card)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      ...style
    }
  }, props), accent && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      width: "100%",
      backgroundColor: "var(--rw-aqua)"
    }
  }), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Toolbar icon button. Transparent; dims to 0.45 opacity when `active`.
 * Pass an icon node (e.g. a Lucide icon) as children.
 */
function IconButton({
  active = false,
  children,
  style = {},
  ...props
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    style: {
      background: "none",
      border: "none",
      padding: 0,
      cursor: "pointer",
      opacity: active ? 0.45 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--rw-white)",
      transition: "opacity var(--rw-dur-fast)",
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * The chapter-name pill from the editor header: mint-green, white border, big rounding.
 * Also serves as a generic value pill.
 */
function Pill({
  children,
  style = {},
  ...props
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      fontFamily: "var(--rw-font-display)",
      backgroundColor: "var(--rw-mint-green)",
      border: "1px solid var(--rw-white)",
      borderRadius: "var(--rw-radius-input)",
      color: "var(--rw-black)",
      fontSize: 18,
      padding: "6px 14px",
      display: "inline-flex",
      alignItems: "center",
      whiteSpace: "nowrap",
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/core/Toolbar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * The formatting-toolbar pill: a raised teal rounded bar that holds IconButtons.
 */
function Toolbar({
  children,
  style = {},
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: 28,
      backgroundColor: "var(--rw-surface-raised)",
      borderRadius: "var(--rw-radius-pill)",
      padding: "12px 20px",
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Toolbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Toolbar.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/StoryCard.jsx
try { (() => {
/**
 * Dashboard story card: title, chapter count, last-updated meta, aqua accent.
 */
function StoryCard({
  title,
  chapters = 0,
  updated = "",
  onClick,
  style = {}
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    accent: true,
    onClick: onClick,
    style: {
      cursor: "pointer",
      transition: "transform var(--rw-dur-fast)",
      ...style
    },
    onMouseEnter: e => e.currentTarget.style.transform = "scale(1.02)",
    onMouseLeave: e => e.currentTarget.style.transform = "scale(1)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 28,
      lineHeight: 1.1,
      color: "var(--rw-light-gray)",
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 16,
      display: "flex",
      gap: 12,
      color: "var(--rw-aqua)"
    }
  }, /*#__PURE__*/React.createElement("span", null, chapters, " ", chapters === 1 ? "chapter" : "chapters"), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.4
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--rw-light-gray)",
      opacity: 0.5
    }
  }, updated))));
}
Object.assign(__ds_scope, { StoryCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/StoryCard.jsx", error: String((e && e.message) || e) }); }

// components/editor/SceneMark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Block-level scene marker. Scenes group whole paragraph(s), so the marker is a
 * thick rail down the LEFT margin with decorative end markers (top + bottom)
 * — no fill. Quiet when idle, stronger when `active` (the scene being edited).
 */
function SceneMark({
  active = false,
  children,
  style = {},
  ...props
}) {
  const op = active ? 1 : 0.4;
  const railW = active ? 6 : 4;
  const dot = active ? 12 : 9;
  const marker = {
    position: "absolute",
    left: (railW - dot) / 2,
    width: dot,
    height: dot,
    background: "var(--rw-scene-marker)",
    borderRadius: "2px",
    transform: "rotate(45deg)",
    opacity: op,
    transition: "all var(--rw-dur-fast) var(--rw-ease)"
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "relative",
      paddingLeft: 24,
      ...style
    }
  }, props), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: 0,
      top: dot / 2,
      bottom: dot / 2,
      width: railW,
      background: "var(--rw-scene-marker)",
      borderRadius: "2px",
      opacity: op,
      transition: "all var(--rw-dur-fast) var(--rw-ease)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      ...marker,
      top: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      ...marker,
      bottom: 0
    }
  }), children);
}
Object.assign(__ds_scope, { SceneMark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editor/SceneMark.jsx", error: String((e && e.message) || e) }); }

// components/editor/SidePanel.jsx
try { (() => {
/**
 * Right-docked side panel (Scene Manager / Version History). Slides in from the right.
 */
function SidePanel({
  open = true,
  title,
  onClose,
  children,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: 640,
      backgroundColor: "var(--rw-surface)",
      borderLeft: "1px solid var(--rw-border-soft)",
      boxShadow: "var(--rw-shadow-panel)",
      display: "flex",
      flexDirection: "column",
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform var(--rw-dur) var(--rw-ease)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 20px",
      borderBottom: "1px solid var(--rw-border-soft)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 20,
      color: "var(--rw-light-gray)",
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--rw-light-gray)",
      opacity: 0.7,
      fontSize: 18,
      lineHeight: 1
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: "auto"
    }
  }, children));
}
Object.assign(__ds_scope, { SidePanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editor/SidePanel.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Small status/label badge. tones: aqua (default), mint, neutral, danger.
 */
function Badge({
  tone = "aqua",
  children,
  style = {},
  ...props
}) {
  const tones = {
    aqua: {
      background: "rgba(63,208,201,0.15)",
      color: "var(--rw-aqua)"
    },
    mint: {
      background: "var(--rw-mint-green)",
      color: "var(--rw-black)"
    },
    neutral: {
      background: "var(--rw-surface-raised)",
      color: "var(--rw-light-gray)"
    },
    danger: {
      background: "rgba(192,57,43,0.18)",
      color: "#e3796c"
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 13,
      padding: "3px 12px",
      borderRadius: "var(--rw-radius-round)",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      lineHeight: 1.3,
      ...tones[tone],
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Re:Write text input. Mint-green fill, hard black border, big rounding, Joan serif.
 */
function Input({
  style = {},
  ...props
}) {
  return /*#__PURE__*/React.createElement("input", _extends({
    style: {
      fontFamily: "var(--rw-font-display)",
      backgroundColor: "var(--rw-input-bg)",
      border: "var(--rw-border-width) solid var(--rw-border-hard)",
      borderRadius: "var(--rw-radius-input)",
      fontSize: 24,
      color: "var(--rw-text-on-light)",
      padding: "10px 20px",
      outline: "none",
      width: "100%",
      ...style
    }
  }, props));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rewrite-app/AuthScreen.jsx
try { (() => {
// AuthScreen — Re:Write login over the forest backdrop.
function AuthScreen({
  onLogin
}) {
  const {
    Logo,
    Input,
    Button
  } = window.ReWriteDesignSystem_e1e021;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      backgroundColor: "var(--rw-dark-mint-green)"
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/forest_bg.jpg",
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.4
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      fontFamily: "var(--rw-font-display)",
      fontSize: 52,
      lineHeight: 1.2,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--rw-aqua)"
    }
  }, "Hello, Author,"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--rw-light-gray)"
    }
  }, "Welcome back to")), /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: "var(--rw-dark-green)",
      borderRadius: "var(--rw-radius-card)",
      boxShadow: "var(--rw-shadow-card)",
      padding: "36px 30px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 18,
      width: 380
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: 76
  }), /*#__PURE__*/React.createElement(Input, {
    placeholder: "Email",
    defaultValue: "author@rewrite.app"
  }), /*#__PURE__*/React.createElement(Input, {
    placeholder: "Password",
    type: "password",
    defaultValue: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onLogin,
    style: {
      marginTop: 4
    }
  }, "Login"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      color: "var(--rw-light-gray)",
      opacity: 0.5,
      fontFamily: "var(--rw-font-display)",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: "currentColor"
    }
  }), " OR ", /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: "currentColor"
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onLogin,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      background: "#fff",
      border: "3px solid #000",
      borderRadius: "var(--rw-radius-pill)",
      fontFamily: "var(--rw-font-display)",
      fontSize: 20,
      padding: "10px 22px",
      cursor: "pointer",
      color: "#000"
    }
  }, /*#__PURE__*/React.createElement(window.RWIcon, {
    name: "globe",
    size: 22
  }), " Continue with Google"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 20,
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--rw-light-gray)"
    }
  }, "No Account?"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--rw-green-lowlight)",
      cursor: "pointer"
    },
    onClick: onLogin
  }, "Create One")))));
}
window.AuthScreen = AuthScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rewrite-app/AuthScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rewrite-app/DashboardScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// DashboardScreen — "Your Stories" grid.
function DashboardScreen({
  onOpenStory,
  onSignOut
}) {
  const {
    Logo,
    Button,
    StoryCard
  } = window.ReWriteDesignSystem_e1e021;
  const stories = [{
    title: "The Lighthouse",
    chapters: 4,
    updated: "Jun 12, 2026"
  }, {
    title: "Salt & Cedar",
    chapters: 2,
    updated: "May 30, 2026"
  }, {
    title: "The Quiet Coast",
    chapters: 7,
    updated: "May 18, 2026"
  }, {
    title: "Untitled Draft",
    chapters: 1,
    updated: "Apr 02, 2026"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      backgroundColor: "var(--rw-dark-mint-green)",
      zIndex: 0
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/forest_bg.jpg",
    alt: "",
    style: {
      position: "fixed",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.4,
      zIndex: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 1,
      minHeight: "100%",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 20px",
      minHeight: 80,
      backgroundColor: "var(--rw-dark-green)",
      boxShadow: "var(--rw-shadow-card)"
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: 44,
    short: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(window.RWIcon, {
    name: "upload",
    size: 16
  }), " Import"), /*#__PURE__*/React.createElement("button", {
    onClick: onSignOut,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--rw-font-display)",
      fontSize: 18,
      color: "var(--rw-light-gray)"
    }
  }, /*#__PURE__*/React.createElement(window.RWIcon, {
    name: "log-out",
    size: 16
  }), " Sign Out")), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      padding: "40px 48px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginBottom: 36
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 20,
      color: "var(--rw-aqua)",
      margin: "0 0 4px"
    }
  }, "Hello, Author,"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 56,
      lineHeight: 1,
      color: "var(--rw-light-gray)",
      margin: 0
    }
  }, "Your Stories")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(window.RWIcon, {
    name: "plus",
    size: 18
  }), " New Story")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 20,
      maxWidth: 880
    }
  }, stories.map(s => /*#__PURE__*/React.createElement(StoryCard, _extends({
    key: s.title
  }, s, {
    onClick: () => onOpenStory(s)
  })))))));
}
window.DashboardScreen = DashboardScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rewrite-app/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rewrite-app/EditorScreen.jsx
try { (() => {
// EditorScreen — the writing surface with toolbar, scene marks, and a side panel.
function EditorScreen({
  story,
  onBack
}) {
  const {
    Logo,
    Pill,
    Toolbar,
    IconButton,
    Button,
    SceneMark,
    SidePanel,
    Badge
  } = window.ReWriteDesignSystem_e1e021;
  const [panel, setPanel] = React.useState(null); // null | 'scenes' | 'versions'
  const [activeScene, setActiveScene] = React.useState(0);
  const Icon = window.RWIcon;
  const scenes = [{
    label: "Arrival at the bay",
    versions: 3
  }, {
    label: "The keeper's letter",
    versions: 2
  }, {
    label: "Dawn on the cliff",
    versions: 1
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      backgroundColor: "var(--rw-dark-mint-green)"
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/forest_bg.jpg",
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.4
    }
  }), /*#__PURE__*/React.createElement("header", {
    style: {
      position: "relative",
      zIndex: 10,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 14px",
      minHeight: 100,
      backgroundColor: "var(--rw-dark-green)",
      boxShadow: "var(--rw-shadow-card)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icon.png",
    alt: "Re:Write",
    onClick: onBack,
    style: {
      height: 72,
      width: 72,
      borderRadius: 14,
      cursor: "pointer"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Pill, null, story ? story.title : "Chapter One"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      fontFamily: "var(--rw-font-display)",
      fontSize: 16,
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: onBack,
    style: {
      color: "var(--rw-aqua)",
      cursor: "pointer"
    }
  }, story ? story.title : "The Lighthouse"), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.3
    }
  }, "|"), /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: "pointer"
    }
  }, "File"), /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: "pointer"
    },
    onClick: () => setPanel("scenes")
  }, "Scenes"), /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: "pointer"
    },
    onClick: () => setPanel("versions")
  }, "Versions"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    style: {
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    active: true
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bold"
  })), /*#__PURE__*/React.createElement(IconButton, null, /*#__PURE__*/React.createElement(Icon, {
    name: "italic"
  })), /*#__PURE__*/React.createElement(IconButton, null, /*#__PURE__*/React.createElement(Icon, {
    name: "underline"
  })), /*#__PURE__*/React.createElement(IconButton, null, /*#__PURE__*/React.createElement(Icon, {
    name: "heading-1"
  })), /*#__PURE__*/React.createElement(IconButton, null, /*#__PURE__*/React.createElement(Icon, {
    name: "list"
  })), /*#__PURE__*/React.createElement(IconButton, null, /*#__PURE__*/React.createElement(Icon, {
    name: "link"
  })), /*#__PURE__*/React.createElement(IconButton, {
    style: {
      marginLeft: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "undo-2"
  })), /*#__PURE__*/React.createElement(IconButton, null, /*#__PURE__*/React.createElement(Icon, {
    name: "redo-2"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => setPanel("scenes")
  }, "Scene Manager"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => setPanel("versions")
  }, "Version History"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("main", {
    style: {
      position: "absolute",
      inset: 0,
      overflowY: "auto",
      display: "flex",
      justifyContent: "center",
      padding: "40px 30px",
      marginRight: panel ? 560 : 0,
      transition: "margin-right var(--rw-dur)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 760,
      alignSelf: "flex-start",
      background: "rgba(255,255,255,0.94)",
      borderRadius: 16,
      boxShadow: "var(--rw-shadow-canvas)",
      padding: "64px 72px",
      minHeight: 700
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 40,
      color: "#111",
      margin: "0 0 28px"
    }
  }, "Chapter One"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--rw-font-body)",
      fontSize: 20,
      lineHeight: 1.8,
      color: "#1a1a1a",
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(SceneMark, {
    active: activeScene === 0
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "The harbor was quiet when she arrived. The lighthouse kept its lonely vigil over the bay, its beam sweeping the dark water in long, patient arcs. No one had lived in the keeper's cottage for years, and yet a single lamp still burned in the upper window.")), /*#__PURE__*/React.createElement(SceneMark, {
    active: activeScene === 1
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "She climbed the path slowly. The keeper's letter was still folded in her coat pocket, soft now from handling, its ink gone the color of weak tea. Every word of it she knew by heart.")), /*#__PURE__*/React.createElement(SceneMark, {
    active: activeScene === 2
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "By the time she reached the door, the sky had begun to pale. Dawn came grey and slow over the cliff, and the gulls woke one by one."))))), panel === "scenes" && /*#__PURE__*/React.createElement(SidePanel, {
    open: true,
    title: "Scene Manager",
    onClose: () => setPanel(null),
    style: {
      width: 560
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "180px 1fr",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: "1px solid var(--rw-border-soft)",
      overflowY: "auto"
    }
  }, scenes.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    onClick: () => setActiveScene(i),
    style: {
      padding: "14px 16px",
      cursor: "pointer",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: i === activeScene ? "var(--rw-surface-raised)" : "transparent"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 16,
      color: "var(--rw-light-gray)"
    }
  }, s.label), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "aqua"
  }, s.versions, " versions"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 18,
      color: "var(--rw-light-gray)",
      margin: "0 0 12px"
    }
  }, scenes[activeScene].label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, ["v3 · current", "v2 · 2 days ago", "v1 · original"].slice(0, scenes[activeScene].versions).map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: v,
    style: {
      background: "var(--rw-surface-raised)",
      borderRadius: 8,
      padding: "10px 14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 15,
      color: "var(--rw-light-gray)"
    }
  }, v), i === 0 ? /*#__PURE__*/React.createElement(Badge, {
    tone: "mint"
  }, "Applied") : /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    style: {
      fontSize: 14,
      color: "var(--rw-aqua)"
    }
  }, "Apply")))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    style: {
      marginTop: 18
    }
  }, "+ New Version")))), panel === "versions" && /*#__PURE__*/React.createElement(SidePanel, {
    open: true,
    title: "Version History",
    onClose: () => setPanel(null),
    style: {
      width: 560
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    style: {
      alignSelf: "flex-start"
    }
  }, "Save Version"), [{
    t: "Working draft",
    d: "Just now",
    cur: true
  }, {
    t: "Before rewrite of opening",
    d: "Jun 11, 2026"
  }, {
    t: "First complete pass",
    d: "Jun 03, 2026"
  }].map(v => /*#__PURE__*/React.createElement("div", {
    key: v.t,
    style: {
      background: "var(--rw-surface-raised)",
      borderRadius: 8,
      padding: "12px 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--rw-font-display)",
      fontSize: 16,
      color: "var(--rw-light-gray)"
    }
  }, v.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--rw-font-sans)",
      fontSize: 12,
      color: "var(--rw-text-muted)",
      marginTop: 2
    }
  }, v.d)), v.cur ? /*#__PURE__*/React.createElement(Badge, {
    tone: "mint"
  }, "Current") : /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    style: {
      fontSize: 14,
      color: "var(--rw-aqua)"
    }
  }, "Restore")))))));
}
window.EditorScreen = EditorScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rewrite-app/EditorScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rewrite-app/icons.jsx
try { (() => {
// Shared Lucide icon wrapper.
// React.memo + imperative innerHTML so React never owns (or tries to reconcile)
// the <svg> that lucide.createIcons() swaps in for our <i data-lucide>.
const RWIcon = React.memo(function RWIcon({
  name,
  size = 18,
  color
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.lucide) return;
    el.innerHTML = `<i data-lucide="${name}"></i>`;
    window.lucide.createIcons();
    const svg = el.querySelector("svg");
    if (svg) {
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      svg.style.display = "block";
    }
  }, [name, size]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    "aria-hidden": "true",
    style: {
      display: "inline-flex",
      width: size,
      height: size,
      color: color || "inherit"
    }
  });
});
window.RWIcon = RWIcon;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rewrite-app/icons.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.Toolbar = __ds_scope.Toolbar;

__ds_ns.StoryCard = __ds_scope.StoryCard;

__ds_ns.SceneMark = __ds_scope.SceneMark;

__ds_ns.SidePanel = __ds_scope.SidePanel;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Input = __ds_scope.Input;

})();
