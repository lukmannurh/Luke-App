-- ============================================================
-- Migration 002: Row Level Security Policies
-- Community Giveaway Platform
-- ============================================================
-- Security model:
--   - All tables use RLS with authenticated role policies
--   - The `rooms` table has NO UPDATE policy for authenticated role —
--     state changes happen via the admin client (service role) in
--     the drawing endpoint only. This prevents client-side tampering.
--   - The `winners` table has NO INSERT/UPDATE/DELETE for authenticated role —
--     only the drawing service (admin client) can write winners.
--   - The `participants` table has NO UPDATE/DELETE — immutable after insert.
-- ============================================================

-- ──────────────────────────────────────────────
-- Enable RLS on all tables
-- ──────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- users table policies
-- ──────────────────────────────────────────────

-- Authenticated users can read all public profiles
CREATE POLICY "authenticated_users_can_view_profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own profile (on OAuth callback)
CREATE POLICY "users_can_insert_own_profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "users_can_update_own_profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ──────────────────────────────────────────────
-- rooms table policies
-- ──────────────────────────────────────────────

-- Authenticated users can view all rooms
CREATE POLICY "authenticated_users_can_view_rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create rooms (must self-assign as host)
CREATE POLICY "authenticated_users_can_create_rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

-- Hosts can only delete their own rooms while they are still active
-- (cannot delete a room that is drawing or finished)
CREATE POLICY "hosts_can_delete_own_active_rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id AND state = 'active');

-- NOTE: NO UPDATE policy for authenticated role.
-- Room state transitions (active → drawing → finished) are performed
-- exclusively by the drawing endpoint using the admin/service role client.
-- This prevents any client from manually changing room state.

-- ──────────────────────────────────────────────
-- participants table policies
-- ──────────────────────────────────────────────

-- Authenticated users can view all participants in any room
CREATE POLICY "authenticated_users_can_view_participants"
  ON participants FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can join rooms that are:
--   1. Currently in 'active' state
--   2. Deadline has not yet passed
--   3. They are inserting their own record (user_id = auth.uid())
CREATE POLICY "authenticated_users_can_join_active_rooms"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM rooms
      WHERE id = room_id
        AND state = 'active'
        AND deadline > now()
    )
  );

-- NOTE: NO UPDATE or DELETE policies.
-- Participants are immutable once created (Number Lock enforcement).
-- This makes number selections permanent and fair.

-- ──────────────────────────────────────────────
-- winners table policies
-- ──────────────────────────────────────────────

-- Authenticated users can view all winners
CREATE POLICY "authenticated_users_can_view_winners"
  ON winners FOR SELECT
  TO authenticated
  USING (true);

-- NOTE: NO INSERT, UPDATE, or DELETE policies for authenticated role.
-- Winners are inserted exclusively by the drawing service using the
-- admin client (service role), which bypasses RLS entirely.
-- This guarantees that only the server-side RNG determines winners.
