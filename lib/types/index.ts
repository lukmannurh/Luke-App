/**
 * Core TypeScript interfaces for the Community Giveaway Platform.
 * These types mirror the database schema and are used across the entire application.
 */

// ──────────────────────────────────────────────
// Enums & Literals
// ──────────────────────────────────────────────

export type RoomState = "active" | "drawing" | "finished";

// ──────────────────────────────────────────────
// Database row types
// ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  credits: number;
}

export interface Room {
  id: string;
  host_id: string;
  title: string;
  description: string;
  min_number: number;
  max_number: number;
  deadline: string;
  total_winners: number;
  state: RoomState;
  created_at: string;
  // Drawing metadata (null until drawing executes)
  drawing_algorithm: string | null;
  drawing_participant_count: number | null;
  drawing_started_at: string | null;
  drawing_completed_at: string | null;
}

export interface Participant {
  id: string;
  room_id: string;
  user_id: string;
  selected_number: number;
  joined_at: string;
}

export interface Winner {
  id: string;
  room_id: string;
  user_id: string;
  selected_number: number;
  sequence: number;
  selected_at: string;
}

// ──────────────────────────────────────────────
// Enriched / joined types (for API responses)
// ──────────────────────────────────────────────

/** User fields safe to display publicly */
export interface PublicUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface RoomWithHost extends Room {
  host: PublicUser;
}

export interface ParticipantWithUser extends Participant {
  user: PublicUser;
}

export interface WinnerWithUser extends Winner {
  user: PublicUser;
}

/** Full room detail including all relations */
export interface RoomDetail extends RoomWithHost {
  participants: ParticipantWithUser[];
  winners: WinnerWithUser[];
  participant_count: number;
}

/** Room list item (lightweight, no full participant list) */
export interface RoomListItem {
  id: string;
  host_id: string;
  host: PublicUser;
  title: string;
  description: string;
  min_number: number;
  max_number: number;
  deadline: string;
  total_winners: number;
  state: RoomState;
  created_at: string;
  participant_count: number;
}

// ──────────────────────────────────────────────
// API Request types
// ──────────────────────────────────────────────

export interface CreateRoomRequest {
  title: string;
  description: string;
  minNumber: number;
  maxNumber: number;
  deadline: string;
  totalWinners: number;
}

export interface JoinRoomRequest {
  selectedNumber: number;
}

// ──────────────────────────────────────────────
// API Response types
// ──────────────────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RoomsListResponse {
  rooms: RoomListItem[];
  pagination: PaginationMeta;
}

export interface DrawingResult {
  roomId: string;
  winners: Array<{
    userId: string;
    selectedNumber: number;
    sequence: number;
  }>;
  drawingStartedAt: string;
  drawingCompletedAt: string;
  participantCount: number;
  algorithm: string;
}

// ──────────────────────────────────────────────
// User profile / stats
// ──────────────────────────────────────────────

export interface UserStats {
  totalParticipations: number;
  totalWins: number;
  totalRoomsHosted: number;
}

export interface ParticipationHistory {
  roomId: string;
  roomTitle: string;
  selectedNumber: number;
  roomState: RoomState;
  isWinner: boolean;
  joinedAt: string;
}

export interface UserProfile extends User {
  stats: UserStats;
  participations: ParticipationHistory[];
}

// ──────────────────────────────────────────────
// Realtime event payloads
// ──────────────────────────────────────────────

export interface RoomStateChangePayload {
  roomId: string;
  newState: RoomState;
  timestamp: string;
}

export interface ParticipantCountUpdatePayload {
  roomId: string;
  count: number;
}

export interface DrawingStartPayload {
  roomId: string;
}

export interface WinnerSelectedPayload {
  roomId: string;
  sequence: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  selectedNumber: number;
}

export interface DrawingCompletePayload {
  roomId: string;
  totalWinners: number;
}

// ──────────────────────────────────────────────
// Countdown timer
// ──────────────────────────────────────────────

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // total milliseconds remaining
  isExpired: boolean;
}
