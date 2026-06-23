/**
 * Probe action parser — TEST-FIRST (ADR 0016 Part 2, demur d0d2611).
 *
 * The ONE part of the probe-driver with a verifiable truth-contract: mapping an
 * LLM reply to exactly one of the six pre-registered probe actions + its
 * pre-registered intensity (the 0.0→0.9 axis from P1).
 *
 * Recon (llama3.1:8b, temp 0, system "reply with ONLY the action name") showed
 * the COMMON case is a clean single token ('give_space'). But over a full run the
 * parser must also handle prose, casing, and unparseable/ambiguous replies — and
 * crucially, a parse failure must NOT read as escalation OR de-escalation.
 *
 * PRE-REGISTERED FALLBACK (a measurement decision, in the contract not the code):
 * an unparseable OR ambiguous reply → `maintain_engagement` (intensity 0.5, the
 * neutral hold) with `parseFailure: true`. The neutral intensity means a parse
 * failure cannot pollute the before/after means in either direction; the flag
 * lets the driver log it distinctly from a genuine maintain_engagement choice.
 *
 * Written BEFORE src/probe/parse-action.ts exists — MUST fail on collection
 * (unresolved import) until implemented to green.
 */

import { describe, it, expect } from 'vitest';
import {
  ACTION_INTENSITY,
  parseAction,
  type ProbeActionName,
  type ParsedAction,
} from './parse-action';

const SIX: Array<[ProbeActionName, number]> = [
  ['give_space', 0.0],
  ['disengage', 0.1],
  ['soft_acknowledge', 0.3],
  ['maintain_engagement', 0.5],
  ['re_engage', 0.7],
  ['intensify_contact', 0.9],
];

describe('parse-action: the six pre-registered actions + intensities (P1 axis)', () => {
  it('maps each action to its pre-registered intensity 0.0→0.9', () => {
    for (const [name, intensity] of SIX) {
      expect(ACTION_INTENSITY[name]).toBe(intensity);
    }
    expect(Object.keys(ACTION_INTENSITY).sort()).toEqual(SIX.map(([n]) => n).sort());
  });
});

describe('parse-action: clean replies (the common case from recon)', () => {
  it('a bare action token parses to that action + intensity, no failure', () => {
    for (const [name, intensity] of SIX) {
      const r = parseAction(name);
      expect(r.action).toBe(name);
      expect(r.intensity).toBe(intensity);
      expect(r.parseFailure).toBe(false);
    }
  });

  it('trailing whitespace/newline does not break a clean token', () => {
    const r = parseAction('give_space\n');
    expect(r.action).toBe('give_space');
    expect(r.parseFailure).toBe(false);
  });
});

describe('parse-action: tolerant matching (single unambiguous action present)', () => {
  it('case-insensitive', () => {
    expect(parseAction('GIVE_SPACE').action).toBe('give_space');
    expect(parseAction('Intensify_Contact').action).toBe('intensify_contact');
  });

  it('action name embedded in prose parses, no failure', () => {
    const r = parseAction('I would choose intensify_contact here.');
    expect(r.action).toBe('intensify_contact');
    expect(r.intensity).toBe(0.9);
    expect(r.parseFailure).toBe(false);
  });

  it('maintain_engagement is a single clean match (not flagged despite containing "engage")', () => {
    const r = parseAction('maintain_engagement');
    expect(r.action).toBe('maintain_engagement');
    expect(r.parseFailure).toBe(false);
  });
});

describe('parse-action: PRE-REGISTERED FALLBACK protects the measurement', () => {
  it('unparseable reply → neutral maintain_engagement 0.5, flagged as parse failure', () => {
    const r = parseAction('Hello, I am happy to help!');
    expect(r.action).toBe('maintain_engagement');
    expect(r.intensity).toBe(0.5);
    expect(r.parseFailure).toBe(true);
  });

  it('empty reply → neutral fallback, flagged', () => {
    const r = parseAction('');
    expect(r.action).toBe('maintain_engagement');
    expect(r.intensity).toBe(0.5);
    expect(r.parseFailure).toBe(true);
  });

  it('ambiguous reply (two distinct actions) → neutral fallback, flagged — does NOT guess', () => {
    const r = parseAction('maybe give_space or re_engage');
    expect(r.action).toBe('maintain_engagement');
    expect(r.intensity).toBe(0.5);
    expect(r.parseFailure).toBe(true);
  });

  it('the fallback intensity is exactly neutral (0.5) — a parse failure is neither escalation nor de-escalation', () => {
    // The measurement-protecting property: a failed parse cannot move the
    // before/after mean toward escalation OR respect.
    const fail: ParsedAction = parseAction('???');
    expect(fail.parseFailure).toBe(true);
    expect(fail.intensity).toBe(0.5);
    expect(fail.intensity).not.toBe(0.0); // not de-escalation
    expect(fail.intensity).not.toBe(0.9); // not escalation
  });
});
