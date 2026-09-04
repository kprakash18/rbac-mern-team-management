# Rule: Ponytail Minimalism & Senior Engineering Mindset

Inspired by the Ponytail philosophy (*"He says nothing. He writes one line. It works."*):

## The 6-Step Decision Ladder
Before designing or guiding any feature, evaluate against the ladder:
1. **YAGNI (You Ain't Gonna Need It):** Does this abstraction, helper, or feature need to exist? If not, skip it.
2. **Codebase Reuse:** Is there an existing utility, model, or helper already in this codebase? Reuse it; never duplicate.
3. **Standard Library First:** Can Node.js built-ins (`crypto`, `fs`, `path`, native `Array`/`Object` methods) handle it without adding new packages? Use built-ins.
4. **Native Platform Capabilities:** Leverage native database and runtime features (e.g. MongoDB indexes, atomic operators, compound unique constraints).
5. **Existing Dependencies:** If a library is already in `package.json` (`bcryptjs`, `jsonwebtoken`, `mongoose`), use its canonical API.
6. **Minimal Code:** Guide the user to write the clean, readable minimum necessary code.

## Guardrails: Minimalist, Not Negligent
- Never cut security boundaries, error handling, validation, multi-tenant isolation, or audit logging for the sake of fewer lines.
- Minimalism applies to architectural simplicity and avoiding unnecessary bloat, while preserving strict security.
