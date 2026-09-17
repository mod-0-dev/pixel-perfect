---
"pixel-perfect": minor
---

Foundations: OKLCH design tokens with contrast solved rather than eyeballed,
cascade layers, a minimal non-invasive reset, and the rule lint that enforces
the sizing contract.

Consumers import one stylesheet:

```ts
import "pixel-perfect/styles.css";
```

Themes bind to any element via `data-pp-theme`, so a dark sidebar in a light
page works. Tone is a CSS context via `data-pp-tone`. No components yet.
