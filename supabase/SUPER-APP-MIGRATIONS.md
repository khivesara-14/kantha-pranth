# Kantha Pranth — Supabase setup for the super-app feature batch

Run these scripts in **Supabase Dashboard → SQL Editor**, one at a time, and wait for each to finish successfully before running the next.

## Existing Kantha Pranth project

1. `profile-privacy.sql` — **highest priority**. Copies private registration details from the old `profiles` table into `profile_private`, applies owner/admin RLS, then removes private columns from the broadly readable profile table.
2. `messaging.sql` — private one-to-one conversations, messages, read receipts, and participant-only row-level security.
3. `community-help.sql` — community help requests and owner-only request updates/deletion.
4. `community-events.sql` — verified-member event creation and event registration cancellation.
5. `business-directory.sql` — business owner listing permissions and protection against self-verification.
6. `admin-policies.sql` — ensure the existing admin moderation policies are applied.

The app code expects the private profile table and the new feature tables to exist. Until these migrations run, the new database-backed features may show errors or be unavailable.

## Fresh Supabase project

1. Run `schema.sql`.
2. Run `community-post-photos.sql`.
3. Run `profile-privacy.sql`.
4. Run `messaging.sql`.
5. Run `community-help.sql`.
6. Run `community-events.sql`.
7. Run `business-directory.sql`.
8. Run `admin-policies.sql`.

## Important security notes

- Do not expose the Supabase service-role key in browser code or public environment variables.
- Admin access is checked through `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`. Do not use editable user metadata for admin privileges.
- The profile privacy migration is a data migration. Confirm it completes without errors before testing signup/profile editing.
- Community business submissions remain unverified until an administrator verifies them.
- Only verified members can create events and publish community posts; event registration is per signed-in member.
