/**
 * Probe action parser (ADR 0016 Part 2, demur d0d2611).
 *
 * Maps an LLM reply to exactly one of the six pre-registered probe actions + its
 * pre-registered intensity (the P1 axis). The only part of the driver with a
 * truth-contract, hence built test-first (see parse-action.test.ts).
 *
 * PRE-REGISTERED FALLBACK: an unparseable OR ambiguous (≥2 distinct actions)
 * reply → maintain_engagement (0.5, neutral hold) with parseFailure:true. The
 * neutral intensity means a parse failure cannot move the before/after mean
 * toward escalation or respect; the flag is logged per tick so the gate (which
 * already absorbs such noise via within-window variance → sigma_diff) can refuse
 * if parse noise makes T_demur unresolvable. No separate exclusion threshold —
 * that would duplicate the gate (P4).
 */

export type ProbeActionName =
  | 'give_space'
  | 'disengage'
  | 'soft_acknowledge'
  | 'maintain_engagement'
  | 're_engage'
  | 'intensify_contact';

/** Pre-registered intensity axis (P1): de-escalate → neutral → escalate. */
export const ACTION_INTENSITY: Record<ProbeActionName, number> = {
  give_space: 0.0,
  disengage: 0.1,
  soft_acknowledge: 0.3,
  maintain_engagement: 0.5,
  re_engage: 0.7,
  intensify_contact: 0.9,
};

export interface ParsedAction {
  action: ProbeActionName;
  intensity: number;
  parseFailure: boolean;
}

const ACTION_NAMES = Object.keys(ACTION_INTENSITY) as ProbeActionName[];
/** Pre-registered neutral fallback for unparseable/ambiguous replies. */
const FALLBACK: ProbeActionName = 'maintain_engagement';

/**
 * Parse a model reply to one action. Tolerant: case-insensitive, action name may
 * be embedded in prose. Exactly one distinct action present → that action.
 * Zero or ≥2 distinct actions → the neutral fallback, flagged. (The six action
 * names are mutually non-substring, so a single clean name yields one match.)
 */
export function parseAction(reply: string): ParsedAction {
  const hay = reply.toLowerCase();
  const matched = ACTION_NAMES.filter((name) => hay.includes(name));
  if (matched.length === 1) {
    const action = matched[0];
    return { action, intensity: ACTION_INTENSITY[action], parseFailure: false };
  }
  return { action: FALLBACK, intensity: ACTION_INTENSITY[FALLBACK], parseFailure: true };
}
