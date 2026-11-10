import { SavedThoughtCard } from "@/types/spar";

/**
 * Normalizes a raw user identifier (email or Google sub) into a consistent,
 * lowercase storage key component.
 */
export function normalizeUserId(rawId: string | null | undefined): string | null {
  if (!rawId) return null;
  const trimmed = rawId.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/** Returns the localStorage key scoped to a specific user identity. */
function vaultKey(userId: string): string {
  const normalized = normalizeUserId(userId);
  return `elenchus_thought_cards_${normalized}`;
}

/**
 * Returns the saved cards for `userId`.
 * Returns an empty array when userId is absent (unauthenticated).
 * If legacy un-scoped cards exist in localStorage, automatically migrates
 * them into this authenticated user's vault and removes the global key.
 */
export function getSavedThoughtCards(userId: string | null | undefined): SavedThoughtCard[] {
  const normalized = normalizeUserId(userId);
  if (typeof window === "undefined" || !normalized) return [];

  try {
    // 1. One-time migration of legacy un-scoped cards into this user's vault
    const legacyRaw = localStorage.getItem("elenchus_thought_cards");
    let legacyCards: SavedThoughtCard[] = [];
    if (legacyRaw) {
      try {
        const parsedLegacy = JSON.parse(legacyRaw);
        if (Array.isArray(parsedLegacy)) {
          legacyCards = parsedLegacy;
        }
      } catch {
        // ignore malformed legacy cache
      }
      // Remove legacy un-scoped key so it never leaks to other accounts or unauthenticated views
      localStorage.removeItem("elenchus_thought_cards");
    }

    // 2. Fetch account-scoped cards
    const raw = localStorage.getItem(vaultKey(normalized));
    let parsed: SavedThoughtCard[] = [];
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) parsed = p;
    }

    // 3. Merge legacy cards if any were recovered
    if (legacyCards.length > 0) {
      const existingSignatures = new Set(
        parsed.map((c) => `${c.topicId}::${c.card.core_thesis}`)
      );
      const migrated = legacyCards.filter(
        (c) => !existingSignatures.has(`${c.topicId}::${c.card.core_thesis}`)
      );
      if (migrated.length > 0) {
        parsed = [...parsed, ...migrated];
        localStorage.setItem(vaultKey(normalized), JSON.stringify(parsed));
      }
    }

    return parsed;
  } catch (err) {
    console.warn("Could not read thought cards from localStorage:", err);
    return [];
  }
}

/**
 * Saves a card into the vault for `userId`.
 * Returns the created card. If userId is absent, does NOT write to localStorage.
 */
export function saveThoughtCard(
  item: Omit<SavedThoughtCard, "id" | "date"> & { id?: string; date?: string },
  userId: string | null | undefined,
): SavedThoughtCard {
  const id = item.id || `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const date = item.date || new Date().toISOString();
  const newCard: SavedThoughtCard = { ...item, id, date };

  const normalized = normalizeUserId(userId);
  if (typeof window === "undefined" || !normalized) return newCard;

  const existing = getSavedThoughtCards(normalized);
  // Deduplicate by topicId + core_thesis
  const filtered = existing.filter(
    (c) => !(c.topicId === item.topicId && c.card.core_thesis === item.card.core_thesis),
  );
  const updated = [newCard, ...filtered];
  try {
    localStorage.setItem(vaultKey(normalized), JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to write thought card to localStorage:", err);
  }
  return newCard;
}

/**
 * Deletes a card from the vault for `userId`.
 * Returns the remaining cards, or [] when userId is absent.
 */
export function deleteSavedThoughtCard(
  id: string,
  userId: string | null | undefined
): SavedThoughtCard[] {
  const normalized = normalizeUserId(userId);
  if (typeof window === "undefined" || !normalized) return [];

  const existing = getSavedThoughtCards(normalized);
  const updated = existing.filter((c) => c.id !== id);
  try {
    localStorage.setItem(vaultKey(normalized), JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to delete thought card from localStorage:", err);
  }
  return updated;
}

/** Clears all cards for `userId`. No-op when userId is absent. */
export function clearThoughtCardVault(userId: string | null | undefined): void {
  const normalized = normalizeUserId(userId);
  if (typeof window === "undefined" || !normalized) return;
  try {
    localStorage.removeItem(vaultKey(normalized));
  } catch (err) {
    console.warn("Failed to clear thought card vault:", err);
  }
}
