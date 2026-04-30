/**
 * Chat history shape migration for collaborative trips.
 *
 * BEFORE (legacy flat array):
 *   chat_history: [{ role, content, isWelcome? }, ...]
 *
 * AFTER (per-user keyed object):
 *   chat_history: { "userId_abc": [{ role, content }...], "userId_def": [...] }
 *
 * Dual-read: tries keyed access first, falls back to flat array.
 * Write: always writes keyed shape for collaborative trips, flat for solo.
 */

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  isWelcome?: boolean;
  planUpdated?: boolean;
};

export type FlatChatHistory = ChatMessage[];
export type KeyedChatHistory = Record<string, ChatMessage[]>;
export type ChatHistory = FlatChatHistory | KeyedChatHistory;

/**
 * Read the current user's chat thread from either shape.
 *
 * - Keyed object: returns chat_history[userId] or [].
 * - Flat array (legacy solo trip): returns the array as-is for owners.
 *   For collaborative trips, a non-owner seeing a flat array gets [] so
 *   they start their own fresh thread rather than seeing the owner's messages.
 * - null/undefined: returns [].
 */
export function readUserChatHistory(
  chatHistory: ChatHistory | null | undefined,
  userId: string,
  options?: { isCollaborative?: boolean; ownerId?: string }
): ChatMessage[] {
  if (!chatHistory) return [];

  if (!Array.isArray(chatHistory) && typeof chatHistory === 'object') {
    return (chatHistory as KeyedChatHistory)[userId] ?? [];
  }

  if (Array.isArray(chatHistory)) {
    // For collab trips: only give the flat array to the owner (it's their legacy history).
    // A non-owner editor/viewer on a not-yet-migrated trip starts with an empty thread.
    if (options?.isCollaborative && options.ownerId && userId !== options.ownerId) {
      return [];
    }
    return chatHistory as FlatChatHistory;
  }

  return [];
}

/**
 * Write the current user's thread back into the correct shape.
 *
 * - Collaborative trip: returns keyed object, merging this user's updated
 *   thread into any existing threads so other users' history is preserved.
 * - Solo trip: returns flat array unchanged.
 *
 * @param existingHistory  full chat_history from the saved trip (flat or keyed)
 * @param userId           current user's ID
 * @param userMessages     the current user's updated message array
 * @param isCollaborative  whether this trip is collaborative
 */
export function writeUserChatHistory(
  existingHistory: ChatHistory | null | undefined,
  userId: string,
  userMessages: ChatMessage[],
  isCollaborative: boolean
): ChatHistory {
  if (!isCollaborative) {
    return userMessages;
  }

  const keyed: KeyedChatHistory = {};

  if (existingHistory && !Array.isArray(existingHistory) && typeof existingHistory === 'object') {
    Object.assign(keyed, existingHistory as KeyedChatHistory);
  }
  // If existingHistory is a flat array, migrateToKeyed handles it at save time
  // before writeUserChatHistory is called (see plan/page.tsx).

  keyed[userId] = userMessages;
  return keyed;
}

/**
 * Lazy migration: move a flat-array history to keyed shape.
 * Called when a solo trip's flat history first needs to become collaborative.
 * The flat messages are attributed to the trip owner.
 */
export function migrateToKeyed(
  flatHistory: FlatChatHistory,
  ownerId: string
): KeyedChatHistory {
  return { [ownerId]: flatHistory };
}

export function isKeyedHistory(
  chatHistory: ChatHistory | null | undefined
): chatHistory is KeyedChatHistory {
  return !!chatHistory && !Array.isArray(chatHistory) && typeof chatHistory === 'object';
}
