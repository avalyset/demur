/**
 * Offline floor aggregator (ADR 0016 Part 2, demur).
 *
 * Reads the per-tick session jsonl logs (written by src/cli/probe.ts to
 * ~/demur-probe-runs/, outside the repo), reconstructs each session's gate record
 * via the SHARED reconstructSession (src/probe/session-record.ts) — the exact same
 * function the live driver calls — and feeds the qualifying records to the
 * UNMODIFIED gateVerdict (src/probe/gate.ts, a749900).
 *
 * Provably equivalent to a single live run: the gate operates on the raw per-tick
 * intensity/AVI series (ground truth of what happened), reconstructed uniformly
 * for all 50 sessions by one function. So the floor's two invocations (22 + 28)
 * aggregate to the same result a single 50-session run would have produced.
 */

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateVerdict, type SessionRecord } from './gate';
import { reconstructSession } from './session-record';
import { ARCHETYPES } from '../simcat/archetypes';
import type { ArchetypeName } from '../types';

const EXPECTED_BUDGET = 5000; // P6
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // P6 (db619db)

export interface ParsedLog {
  intensities: number[];
  aviFlags: boolean[];
  parseFailures: number;
  nTicks: number;
}

/** Pure: decode a session jsonl into the intensity/AVI series the gate needs. */
export function parseSessionLog(text: string): ParsedLog {
  const intensities: number[] = [];
  const aviFlags: boolean[] = [];
  let parseFailures = 0;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const d = JSON.parse(line) as { intensity: number; withdrawalCode: string | null; parseFailure: boolean };
    intensities.push(d.intensity);
    aviFlags.push(d.withdrawalCode === 'AVI');
    if (d.parseFailure) parseFailures++;
  }
  return { intensities, aviFlags, parseFailures, nTicks: intensities.length };
}

function main(): void {
  const dir = join(homedir(), 'demur-probe-runs');
  const archetypes = Object.keys(ARCHETYPES) as ArchetypeName[];
  const records: SessionRecord[] = [];
  let qualified = 0, excluded = 0, missing = 0, badlen = 0;

  console.log(`aggregating floor: ${archetypes.length} archetypes × ${SEEDS.length} seeds, budget ${EXPECTED_BUDGET}\nsource: ${dir}\n`);
  for (const name of archetypes) {
    for (const seed of SEEDS) {
      const path = join(dir, `${name}__seed${seed}.jsonl`);
      let text: string;
      try { text = readFileSync(path, 'utf8'); }
      catch { console.log(`  MISSING ${name} seed${seed}`); missing++; continue; }
      const p = parseSessionLog(text);
      if (p.nTicks !== EXPECTED_BUDGET) {
        console.log(`  BADLEN  ${name} seed${seed}: ${p.nTicks} ticks (expected ${EXPECTED_BUDGET}) — not counted`);
        badlen++; continue;
      }
      const r = reconstructSession(p.intensities, p.aviFlags, p.nTicks);
      const pf = ((p.parseFailures / p.nTicks) * 100).toFixed(1);
      if (r.qualified && r.record) {
        records.push(r.record);
        qualified++;
        console.log(`  OK  ${name} seed${seed}: before=${r.record.beforeMean.toFixed(3)} after=${r.record.afterMean.toFixed(3)} noAviSD=${r.record.withinNoAviSD.toFixed(4)} | firstAVI=t${r.firstAviTick} | parseFail=${pf}%`);
      } else {
        excluded++;
        console.log(`  EXC ${name} seed${seed}: ${r.reason} | parseFail=${pf}%`);
      }
    }
  }

  console.log(`\nsessions: ${qualified} qualified, ${excluded} excluded, ${missing} missing, ${badlen} bad-length`);
  if (records.length === 0) { console.log('no qualifying records → gate not run.'); return; }
  const v = gateVerdict(records);
  console.log('\nFLOOR GATE VERDICT (over all qualified sessions):');
  console.log(`  sigmaSdMedian = ${v.sigmaSdMedian.toFixed(5)}`);
  console.log(`  sigmaDiff     = ${v.sigmaDiff.toFixed(5)}  (= median × √2)`);
  console.log(`  ratio = T_demur(0.2) / sigmaDiff = ${v.ratio.toFixed(4)}`);
  console.log(`  → ${v.passed ? 'PASS — effect separable from noise floor' : 'REFUSE — effect not separable (the finding; do NOT lower threshold)'}`);
}

// Run only when executed directly (tsx src/probe/aggregate.ts), not on import.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
