# Frontend Design Implementation Rules

## Strict Design Fidelity Rule
1. **Verbatim Markup Implementation**: Whenever the user provides UI design code, HTML, or component markup, implement it strictly as provided without altering, removing, or substituting class names, CSS tokens, structures, or layouts.
2. **Zero Unprompted Style Modifications**: Do NOT introduce new styles, alternative Tailwind classes, or arbitrary redesigns unless the user explicitly requests specific changes (e.g. modifying text, fonts, colors, or layout).
3. **Preserve Existing Pages & Features**: Never remove or overwrite existing pages, routes, or components when adding new views. All pages must remain active and accessible.
