## 2024-01-10 - Secure Storage Limitations
**Vulnerability:** Session tokens and large data (>2048 bytes) are stored in `AsyncStorage` (unencrypted) instead of `SecureStore`.
**Learning:** `SecureStore` on Android has a strict size limit. To handle large items like complex JWTs or session objects, a fallback is necessary, but this exposes sensitive data on rooted devices.
**Prevention:** In future, consider encrypting large payloads with a key stored in `SecureStore` before saving to `AsyncStorage`, or use a dedicated encrypted storage library like `react-native-encrypted-storage`.
