# Security Spec for mimu Firestore Database

This document defines the security boundaries, invariant rules, and payloads of the "mimu" application to guard against Cyberbullying, Identity Impersonation, and Injection attacks.

## 1. Data Invariants

1. **Profile Invariants**:
   - Each profile document ID MUST match the username in lowercase.
   - Usernames must conform to alphanumeric characters and dashes (`^[a-zA-Z0-9_-]+$`).
   - The security `pin` must be a high-entropy numeric string of at least 4 digits.
   - `createdAt` must be set to the server timestamp `request.time`.
   - Immutable fields (`username`, `createdAt`) cannot be changed after creation.

2. **Message Invariants**:
   - Every message MUST specify a valid receiver profile, preventing orphan messages.
   - Message body `text` must be a string of size <= 500 characters.
   - Fields like `status` must be restricted to standard categories: `approved`, `quarantined`, or `blocked`.
   - `createdAt` must be set to the server timestamp `request.time` during creation.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent attacker attempts to breach the system. They must result in a `PERMISSION_DENIED` response from Firestore:

1. **D1: Profile Hijack** – Attempting to register or overwrite an existing user's profile without providing any authentication or matching PIN.
2. **D2: ID Poisoning** – Creating a profile with a 1MB junk garbage string as the username ID to trigger Denial of Wallet.
3. **D3: Self-Granted privileges** – Attacker tries to set an unverified custom field `role: "admin"` or `isAdmin: true` in their profile during registry.
4. **D4: State Hijacking** – Directly changing a message status from `'quarantined'` to `'approved'` to bypass AI moderate safeguards.
5. **D5: Missing Required Fields** – Inserting a message with a missing `receiverUsername` or `status` property.
6. **D6: Character Flooding** – Injecting a 2MB message body to crash the web database rendering engine.
7. **D7: Future Stamp Injection** – Sending an anonymous message with a fake future `createdAt` stamp set to the year 2035 to stay pinned at the top of the feed.
8. **D8: Bulk Scraping** – Unauthenticated list inquiry on `messages` without recipient credentials.
9. **D9: PIN Manipulation** – An attacker trying to rewrite another user's security `pin` via profile updates.
10. **D10: Cross-user deletion** – Deleting a message that belongs to a different recipient's inbox.
11. **D11: Orphaned Message Link** – Creating a message for a non-existent recipient username.
12. **D12: Spammer Flooding** – Attempting to bulk-write 100 messages in a single second using client scripts.

---

## 3. The Test specification

The following testing harness simulates firestore transactions for rules validation.

```typescript
// firestore.rules.test.ts
// Automated secure validation runner for the mimu fortress rules.
```
