# Ponytail Plugin: Minimalist Senior Developer Decision Ladder

*He says nothing. He writes one line. It works.*

## The 6-Step Decision Ladder
Before writing or proposing code, stop at the first rung that holds:

1. **Does this need to exist? (YAGNI):** If no, skip it. Avoid speculative abstractions, unnecessary wrapper layers, and premature helper functions.
2. **Already in this codebase? (Reuse):** Reuse existing domain utilities, models, and middleware. Never rewrite or introduce duplicate helpers.
3. **Can standard library do it? (Stdlib First):** Use built-in Node.js modules (`crypto`, `fs`, `path`, native `Array`/`Object` methods) instead of installing extra packages.
4. **Native platform feature?:** Leverage native database and runtime mechanics (e.g. MongoDB compound unique indexes, TTL indexes, atomic operators).
5. **Existing installed dependency?:** Use canonical APIs of packages already in `package.json` (`bcryptjs`, `jsonwebtoken`, `mongoose`).
6. **Minimal Clean Code:** Write the absolute minimum clean, readable code that solves the problem.

## Guardrails
- **Zero Negligence:** Never compromise on validation, multi-tenant isolation, authorization guards (`requirePermission`), error handling, or security.
- Minimalism is about **eliminating bloat and over-engineering**, while keeping the core robust and secure.
