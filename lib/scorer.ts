/**
 * scorer.ts — Claude Haiku credibility scoring for shark sighting articles.
 *
 * Batch-scores every article in one API call (cheap + fast).
 * Score 0–100:
 *   85–100  Confirmed — specific beach/location, credible outlet, clear details
 *   65–84   Likely real — named location, good sourcing, no red flags
 *   40–64   Probably real but vague — general region, thin sourcing
 *   20–39   Low confidence — social media rumor, very vague, second-hand
 *   0–19    Fake, satire, clickbait, or clearly unrelated
 *
 * Trusted scientific/official sources are pre-scored at 90 (skip API call).
 * Runs once per cache cycle so cost is ~$0.003/run.
 */

import Anthropic from "@anthropic-ai/sdk";
import { Sighting } from "./types";

const MODEL = "claude-haiku-4-5-20251001";
const BATCH_SIZE = 40;

const TRUSTED_SOURCES = new Set([
  "Ocearch Tracker",
  "Florida Museum ISAF",
  "Shark Research Committee",
  "Dorsal Watch AU",
]);

async function scoreBatch(
  items: { idx: number; title: string; source: string; location: string }[]
): Promise<number[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return items.map(() => 50);

  const client = new Anthropic({ apiKey });

  const prompt = `Rate each shark news article 0-100 for credibility and likelihood of being a real incident.

85-100: Confirmed incident — specific beach/location, credible news outlet, named victim or responder, official confirmation
65-84:  Likely real — named location, reputable source, reasonable detail level
40-64:  Probably real but vague — general region only, unknown sourcing, brief mention
20-39:  Low confidence — social media post, very vague, second-hand/rumored
0-19:   Fake, satire, clickbait, or clearly not a real shark sighting

Articles:
${items.map((i) => `[${i.idx}] ${i.source} — "${i.title}" (${i.location})`).join("\n")}

Return ONLY a JSON array of integers in the same order. Example: [82, 45, 91]
No explanation, no markdown fences, just the array.`;

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (msg.content[0] as { type: string; text: string }).text.trim();
    const match = text.match(/\[[\d,\s]+\]/);
    if (!match) return items.map(() => 50);
    const scores: number[] = JSON.parse(match[0]);
    return scores.map((s) => Math.min(100, Math.max(0, Math.round(s))));
  } catch {
    return items.map(() => 50);
  }
}

export async function scoreSightings(sightings: Sighting[]): Promise<Sighting[]> {
  if (!process.env.ANTHROPIC_API_KEY) return sightings;

  // Pre-assign trusted sources, queue the rest
  type QueueEntry = { sighting: Sighting; originalIdx: number };
  const queue: QueueEntry[] = [];

  const result: Sighting[] = sightings.map((s, i) => {
    if (TRUSTED_SOURCES.has(s.source)) return { ...s, healthScore: 90 };
    queue.push({ sighting: s, originalIdx: i });
    return s;
  });

  if (queue.length === 0) return result;

  // Score in batches
  const scoreMap = new Map<number, number>();
  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);
    const items = batch.map((entry, bIdx) => ({
      idx: bIdx,
      title: entry.sighting.title,
      source: entry.sighting.source,
      location: entry.sighting.location,
    }));
    const scores = await scoreBatch(items);
    batch.forEach((entry, bIdx) => {
      scoreMap.set(entry.originalIdx, scores[bIdx] ?? 50);
    });
  }

  return result.map((s, i) => {
    if (scoreMap.has(i)) return { ...s, healthScore: scoreMap.get(i)! };
    return s;
  });
}
