## 2025-12-31 - Secure Logging Pattern
**Vulnerability:** Sensitive data (passwords, tokens, PII) can leak into production logs if `console.error` is used directly with raw objects.
**Learning:** React Native/Expo environments might not strip `console` logs in production by default, and `JSON.stringify` on objects containing circular references (common in React) will crash the app.
**Prevention:** Use the centralized `src/utils/logger.ts` which:
1. Checks environment (`process.env.NODE_ENV`).
2. Sanitizes input objects (redacts sensitive keys).
3. Handles circular references safely using `WeakSet`.
4. Suppresses stack traces in production.