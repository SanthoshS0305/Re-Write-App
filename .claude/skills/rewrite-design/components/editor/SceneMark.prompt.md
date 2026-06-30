Re:Write's signature marker. Scenes group whole paragraphs, so this wraps block content with a thick blue rail down the left margin and decorative diamond end markers (top + bottom) — no fill. Faint when idle, stronger when `active` (the scene being edited). Spans multiple paragraphs.

```jsx
<SceneMark>
  <p>A single-paragraph scene…</p>
</SceneMark>

<SceneMark active>
  <p>A multi-paragraph scene…</p>
  <p>…the rail spans all of it.</p>
</SceneMark>
```
