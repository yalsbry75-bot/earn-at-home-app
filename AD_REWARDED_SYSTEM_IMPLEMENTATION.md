# Rewarded Advertising System Implementation

## Summary

A backend-secured rewarded advertising system was added for the Adsterra Smartlink task.

Smartlink used:

`https://www.effectivecpmnetwork.com/csf2m6gv?key=92b5acf44c1118964f9a9aa030f41bd2`

## User-Facing Task

A new task card was added to the Tasks page:

- Title: `Watch Advertisement`
- Description: `Watch advertisements and earn reward points.`
- Reward: `20 Points`
- Button: `Watch Advertisement and Earn Points`

## Backend Functions Added

All rewarded advertising mutations are handled through Firebase Callable Functions only.

### `startAdRewardSession`

Creates or reuses one active advertisement reward session for the authenticated user.

Security behavior:

- Requires Firebase Auth.
- Checks high-risk fraud flags.
- Checks risk score.
- Checks daily reward limit.
- Checks reward cooldown.
- Prevents multiple active ad sessions.
- Logs session starts and duplicate session attempts.
- Returns the Smartlink with tracking parameters.

### `completeAdRewardSession`

Verifies and grants the advertisement reward.

Security behavior:

- Requires Firebase Auth.
- Confirms the session belongs to the current user.
- Confirms the session is active and not expired.
- Requires server-side elapsed interaction time before reward claim.
- Blocks duplicate claims for the same session.
- Applies cooldown and daily limit protections.
- Uses idempotent transaction ID: `reward_ad_<sessionId>`.
- Grants points only via backend `grantReward()`.
- Creates transaction, points ledger, activity log, wallet update, notification.

### `getAdRewardStatus`

Returns the current user's rewarded ad eligibility status.

## Firestore Records Added

The implementation adds records in existing compatible collections and one new tracking collection:

- `adRewardSessions` — per-session tracking and verification status.
- `transactions` — completed advertisement rewards.
- `pointsLedger` — points movement ledger.
- `activityLogs` — session starts, duplicate attempts, rejections, completions.
- `notifications` — user-facing reward success message.
- `wallets` — point balance updates.
- `users.rewardState` — cooldown and active-session metadata.

## Anti-Abuse Rules

Current values:

- Reward: `20 points`.
- Minimum server-side interaction window: `30 seconds`.
- Cooldown between rewarded advertisement claims: `2 minutes`.
- Daily rewarded advertisement limit: `20 claims`.
- Session expiry: `15 minutes`.

## Verification Notes

Verified in this package:

- Firebase Functions TypeScript build passes.
- Modified frontend TypeScript/TSX syntax transpilation passes.
- JSON configuration files are valid; `tsconfig.node.json` is JSONC and contains comments from the original project.
- ZIP integrity test passes after packaging.

## Important Limitation

Because Adsterra Smartlink is a third-party cross-domain page and no postback endpoint was supplied, the app cannot cryptographically prove that an advertisement was fully watched. The implemented verification uses backend-controlled session timing, cooldowns, duplicate protection, fraud checks, and logging. If Adsterra postback/S2S callbacks are later enabled, they should be connected to the same `adRewardSessions` records for stronger verification.
