# Re:Write App — UI Kit

An interactive, high-fidelity recreation of the Re:Write writing app. Click-through:

**Login → Dashboard → Editor**

- `AuthScreen.jsx` — login over the forest backdrop; the "Hello, Author," hero + logo card.
- `DashboardScreen.jsx` — "Your Stories" grid of `StoryCard`s with the header bar.
- `EditorScreen.jsx` — the writing surface: header (logo, chapter pill, File/Scenes/Versions menu, formatting `Toolbar`), the centered paper canvas with `SceneMark` passages, and the **Scene Manager** / **Version History** side panels.

## Run
Open `index.html`. It loads React + Babel, Lucide (icons) from CDN, and the compiled `_ds_bundle.js` for the shared components.

## Interactions
- Login button / Google / "Create One" → Dashboard
- Story card → Editor (chapter pill picks up the story title)
- App icon or story link → back to Dashboard
- "Scenes" / "Scene Manager" → scene list + version apply panel
- "Versions" / "Version History" → save/restore version panel
- Sign Out → Login

Built from the `rewrite/` Next.js codebase (authoritative source) and the ReWrite Mockup Figma.
