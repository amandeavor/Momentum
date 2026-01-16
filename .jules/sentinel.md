## 2024-05-22 - [Insecure Persistence of Auth State]
**Vulnerability:** Redux Persist was configured to store the `auth` slice (including session tokens) in unencrypted `AsyncStorage`, exposing sensitive user data to anyone with file system access.
**Learning:** Even when using a secure storage adapter for the auth client (Supabase), state management libraries (Redux Persist) can inadvertently create insecure copies of sensitive data if not carefully configured.
**Prevention:** Explicitly exclude sensitive slices (like `auth`) from persistence whitelists or use encrypted storage engines for Redux Persist.
