# Re:Write — Design System

A web-based **creative-writing editor** with a calm, nature-inspired aesthetic. Re:Write helps fiction writers manage their work with three signature ideas:

- **Modular scenes** — select any passage and turn it into a versioned "scene." Each scene keeps its own history, and you can swap between versions of a paragraph in place.
- **Document version control** — save named snapshots of a chapter, compare them, and restore any prior state.
- **Editor mode** — an author can toggle a comment-only mode to grant another user read/comment access.

The brand vibe is **serenity and nature**: deep forest greens, mint and aqua accents, a soft forest-path photograph behind every screen, and the warm serif **Joan** as the voice throughout.

## Sources

This system was built from:

- **Codebase** (authoritative): `rewrite/` — a Next.js 14/16 + React + Tiptap app. GitHub: https://github.com/SanthoshS0305/Re-Write-App — explore it for deeper component logic, the Tiptap scene extension, offline sync, and `.rewr` import/export.
- **Figma**: "ReWrite Mockup.fig" — login/dashboard/editor mockups plus a generic rich-text-editor icon set.

> Note: the Figma's component families (Formatting, Arrows, Content, Tables & Cells, …) are a **stock Froala-style editor icon library**, not Re:Write's own components. The shipping app uses **Lucide React** icons, so this system standardizes on Lucide (see Iconography). The color/type/layout tokens come straight from the codebase `globals.css` + `CLAUDE.md`, which are the real spec.

---

## Content Fundamentals

- **Voice**: warm, literary, second-person. The product addresses the writer directly as **"Author"** — every screen greets with *"Hello, Author."* Headings are short and human: *"Your Stories"*, *"Welcome back to"*.
- **Casing**: Title Case for headings and buttons (*New Story*, *Scene Manager*, *Version History*). Sentence case for body and helper text.
- **Tone**: encouraging and quiet, never shouty. Empty states are gentle: *"You don't have any stories yet."*
- **Punctuation as brand**: the **colon in `Re:Write`** is a fixed device — mint-green so it contrasts the dark surfaces the wordmark sits on. Meta uses middot separators (`4 chapters · Jun 12`).
- **No emoji.** The brand never uses emoji. Icons are line icons (Lucide).
- **Nouns**: Story → Chapter → Scene → Version is the core hierarchy; use these words consistently.

---

## Visual Foundations

- **Color**: an earthy, forest palette. Deep teal-greens (`#02353c`, `#044c56`) are the *surfaces* (cards, header, panels). **Aqua** `#3fd0c9` is the primary accent (logo "Re", headings, links). **Mint** `#c1f6ed` fills inputs and is the light-mode base. **Action green** `#34c18a` is reserved for primary buttons. Text on dark surfaces is `#f3f3f3` light-gray. See `tokens/colors.css`.
- **Type**: **Joan** (serif) is the entire brand voice — display *and* body. It's used at large sizes (96px logo, 64px hero, 56px page heading) down to 16px meta. **DM Sans** appears only sparingly for dense UI metadata. See `tokens/typography.css`.
- **Backgrounds**: a single hero photograph — `assets/forest_bg.jpg`, a sunlit forest path — sits behind **every** screen at **40% opacity** over a `--rw-dark-mint-green` base. This is the most distinctive visual signature. No gradients, no patterns.
- **Cards**: dark-green fill, `10px` radius, one soft drop shadow (`0 4px 4px rgba(0,0,0,0.25)`). Story cards add a 4px **aqua top hairline**.
- **Borders**: primary buttons and inputs use a deliberate **hard 3px black border** — a slightly playful, sketch-like touch against the soft greens. Soft internal dividers use `--rw-dark-green-highlight`.
- **Radii**: rounding is generous and pill-forward — inputs/pills `20px`, buttons/toolbar `30px`, cards `10px`.
- **Shadows**: just two — the card shadow above, and a deeper canvas shadow (`0 8px 32px`) for the editor paper. Side panels use a left-cast shadow.
- **Animation**: restrained. A `fadeUp` entrance (0.45s ease) on page content; `0.15s` opacity transitions on hover; `0.3s` ease slide for side panels. No bounces.
- **Hover**: buttons drop to `opacity: 0.9`; links to `0.7–0.8`; cards lift with `scale(1.02)`.
- **Press / active**: formatting toolbar buttons dim to `opacity: 0.45` when active (the "is-on" convention).
- **Transparency & blur**: the editor paper is translucent white (`rgba(255,255,255,0.94)`) so the forest reads faintly through it; dark mode uses `rgba(0,0,0,0.8)`. No backdrop blur.
- **Imagery vibe**: warm, natural, green — sunlit forest, earthy. Never cold or corporate.

---

## Iconography

- **System: Lucide** (line icons), matching the shipping app's `lucide-react` usage. Stroke icons, \~18px in toolbars, 16px in buttons.
- In HTML artifacts, load Lucide from CDN: `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>`, place `<i data-lucide="bold"></i>`, then call `lucide.createIcons()`.
- Common icons in the product: `bold`, `italic`, `underline`, `heading-1/2/3`, `list`, `list-ordered`, `link`, `undo-2`, `redo-2`, `upload`, `log-out`, `plus`, `trash-2`, `x`.
- The **app icon** is a raster logo, `assets/icon.png` (rounded square). The wordmark itself is type, not an SVG — use the `Logo` component.
- **No emoji, no unicode glyph icons** (except the toolbar's typographic `S`/`"`/`<>` marks that exist in the real editor).

---

## Index / Manifest

**Root**

- `styles.css` — global entry (imports all tokens + fonts). Consumers link this.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css`.
- `assets/` — `forest_bg.jpg` (hero backdrop), `icon.png` (app icon), `woman.jpg` (alt backdrop).
- `guidelines/` — foundation specimen cards (colors, type, spacing, brand).
- `SKILL.md` — Agent Skills entry point.

**Components** (`components/`, namespace `window.ReWriteDesignSystem_*`)

- `brand/Logo` — the Re:Write wordmark.
- `core/Button`, `core/Card`, `core/Pill`, `core/IconButton`, `core/Toolbar`.
- `forms/Input`.
- `feedback/Badge`.
- `editor/SceneMark`, `editor/SidePanel`.
- `dashboard/StoryCard`.

**UI Kits** (`ui_kits/`)

- `rewrite-app/` — interactive Login → Dashboard → Editor click-through.

## Caveats / substitutions

- **Fonts** load from Google Fonts (Joan, DM Sans) — both are the *real* fonts the product uses, so no substitution; swap to self-hosted `@font-face` if you need offline use.
- The Figma icon set was **not** materialized (it's a generic stock library the app doesn't ship); Lucide is used instead, per the codebase.
