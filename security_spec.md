# ARENA AZ Security Specification (Phase 0 — Payload-First TDD)

## 1. Data Invariants
1. **PII Isolation**: `/users/{userId}` contains `email` and personal preferences; `get`, `create`, and `update` are restricted to `isOwner(userId)` or `isAdmin()`. Blanket `list` is strictly denied.
2. **No Self-Assigned Privileges**: Users cannot write to `/admins/{userId}`, `/featureFlags/{flagId}`, or `/featuredPicks/{pickId}`, and cannot create a user profile with `plan: 'pro'` or any ghost `role`/`isAdmin` field.
3. **Owner Scoping & Query Enforcement**: `/coupons`, `/bankrollBets`, `/contestPredictions`, and `/tipsterFollows` enforce `incoming().ownerId == request.auth.uid` on create, `incoming().ownerId == existing().ownerId` on update, and `resource.data.ownerId == request.auth.uid` on `list`.
4. **Terminal State Locking**: Once a `bankrollBets` document transitions from `pending` to `won`, `lost`, or `void`, non-admin users cannot alter `status`, `stake`, or `odds`.
5. **Temporal Integrity**: All `createdAt` and `updatedAt` fields must strictly equal `request.time`.
6. **Path & Size Hardening**: Every single-doc target validates `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars), every string checks `.size()`, and every array checks `.size() <= MAX` plus first-element type checks.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Ghost Admin Escalation**: `CREATE /users/u1` with `{ ...validUser, isAdmin: true, role: "admin" }`.
2. **PII Blanket Read**: `GET /users/u2` authenticated as `u1`.
3. **Unverified Email Spoof**: `CREATE /coupons/c1` with `email_verified: false`.
4. **Cross-Owner Spoofing**: `CREATE /coupons/c1` as `u1` with `ownerId: "u2"`.
5. **Unfiltered List Scraping**: `LIST /bankrollBets` without `where('ownerId', '==', uid)`.
6. **Shadow Update Injection**: `UPDATE /users/u1` adding unknown key `credits: 99999`.
7. **Terminal Bet Tampering**: `UPDATE /bankrollBets/b1` changing `status` from `lost` back to `won`.
8. **Immutable Field Overwrite**: `UPDATE /coupons/c1` changing `createdAt` or `ownerId`.
9. **Client Timestamp Forgery**: `CREATE /contestPredictions/p1` with backdated client `createdAt`.
10. **Path ID Poisoning**: `CREATE /coupons/<200-char-junk-id>` failing `isValidId()`.
11. **Array Exhaustion**: `UPDATE /users/u1` with 25 entries in `favoriteTeams` (> 20 cap) or non-string element `[123]`.
12. **Non-Admin Flag Tampering**: `UPDATE /featureFlags/valueBets` as regular authenticated user.
