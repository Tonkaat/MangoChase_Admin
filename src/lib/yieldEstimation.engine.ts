// src/lib/yieldEstimation.engine.ts
//
// ════════════════════════════════════════════════════════════════════════════
// RULE-BASED YIELD ESTIMATION ENGINE  (replaces the Random Forest model)
// ════════════════════════════════════════════════════════════════════════════
//
// WHY THIS EXISTS
// ----------------
// The partner farm does not keep historical harvest records, so there is no
// real dataset to train a regression model on. The previous Phase 2 approach
// trained a Random Forest on SYNTHETIC data, which means its "confidence" and
// "feature importance" numbers were not actually learned from real harvests —
// they were artifacts of made-up training data. That is not defensible in a
// capstone setting.
//
// This module replaces that entirely. It is a deterministic, hand-specified
// formula: every multiplier below is either (a) a documented horticultural
// fact about Carabao mango, or (b) an explicit modeling assumption that is
// labeled as such. Nothing here is "learned." Nothing here requires a
// training set, a .pkl file, or a Python backend. Given the same inputs, it
// always returns the same output — which is exactly what you want to be able
// to explain, line by line, during a defense.
//
// TERMINOLOGY
// -----------
// We call this "Yield ESTIMATION," not "prediction" or "forecasting."
// Prediction/forecasting implies projecting a *future* harvest from a time
// series of *past* harvests — which we don't have. Estimation means: "given
// the tree's condition *right now*, what would a tree in this condition
// typically produce?" That's a snapshot judgment, not a forecast.
//
// ════════════════════════════════════════════════════════════════════════════
// ⚠️ DATA REALITY CHECK — READ BEFORE TUNING ANYTHING BELOW
// ════════════════════════════════════════════════════════════════════════════
//
// An earlier version of this engine modeled FIVE factors, including a
// continuous 0.0–1.0 "infection rate" and a three-state "Healthy / Warning /
// Critical" tree status. Neither of those fields actually exists in the
// current Firestore schema (see src/services/firebase/tree-service.ts).
// What actually exists, per tree, is:
//
//   healthStatus: string   — observed values: 'Healthy' | 'Infected' (binary)
//
// There is no continuous severity score and no three-state vigor tag today.
// `tree-service.ts` aggregates this into a cluster-level
// `infectedCount / treeCount` ratio (stored as `avgInfectionRate`, which is
// really a HEADCOUNT FRACTION, not a severity average — a cluster with 1
// severely-infected tree and a cluster with 1 mildly-infected tree currently
// look identical to this ratio).
//
// Rather than inventing severity precision the data doesn't support, this
// engine uses a single **healthFactor**, driven directly by the fraction of
// trees in a cluster classified Healthy. This is the honest, defensible
// version of what the old two-factor (infectionRate × statusFactor) design
// was trying to do with data that doesn't exist yet.
//
// UPGRADE PATH: if you later add a continuous per-tree severity field (e.g.
// from CNN softmax confidence, lesion-area percentage, etc.) or a
// Warning/Critical status tag, see the "FUTURE UPGRADE HOOK" comment block
// right above `computeHealthFactor()` below — it's written so you can swap
// in a richer formula there without touching anything else in this file.
//
// ════════════════════════════════════════════════════════════════════════════
// THE MODEL (current, binary-health version)
// ════════════════════════════════════════════════════════════════════════════
//
//   estimatedYield (kg/tree) = BASE_YIELD_KG
//                              × ageFactor
//                              × healthFactor
//                              × seasonFactor
//                              × weatherFactor
//
// Each factor is a multiplier centered around 1.00 ("no effect / baseline
// healthy mature tree in dry season under normal weather"). Multipliers above
// 1.00 mean "this condition is better than baseline," below 1.00 means
// "worse than baseline." This mirrors how an actual mango grower or
// agricultural extension worker reasons about a tree informally — it's just
// made explicit and numeric here so the system can compute it consistently.
//
// All four factors and their justifications are documented in detail next to
// the function that computes them below.
//
// ════════════════════════════════════════════════════════════════════════════

// ─── Public types ───────────────────────────────────────────────────────────

/**
 * Matches the ONLY condition field that actually exists on a tree document
 * today (`TreeData.healthStatus` in tree-service.ts). If your CNN or manual
 * inspection workflow currently writes other string values besides these
 * two, treat anything that isn't exactly 'Healthy' as 'Infected' when
 * building this input (see the cluster adapter at the bottom of this file).
 */
export type HealthStatus = 'Healthy' | 'Infected';

export type Season = 'Dry' | 'Wet';

/**
 * Raw inputs this engine actually needs, matching what's really available
 * today. Each cluster is summarized as: how many trees are healthy out of
 * how many total, plus average age and current weather.
 */
export interface YieldEstimationInput {
  /** Average age of trees in this cluster, in years (from tree-service's
   *  `avgAge`, or computed from `plantedDate` — see tree-service.ts). */
  treeAgeYears: number;

  /** Number of trees in the cluster currently classified 'Healthy'. */
  healthyCount: number;

  /** Total number of trees in the cluster (healthy + infected + unknown). */
  totalCount: number;

  /** Current season. Can be passed in explicitly, or omitted to auto-detect
   *  from the current date (see `detectSeasonFromDate` below). */
  season: Season;

  /** Average ambient temperature, in °C, e.g. from the existing WeatherService. */
  temperatureC: number;

  /** Recent/forecast rainfall, in mm, over the relevant period (e.g. last 7 days),
   *  also sourced from the existing WeatherService. */
  rainfallMm: number;
}

export interface YieldRange {
  min: number;
  max: number;
}

export interface YieldFactors {
  ageFactor: number;
  healthFactor: number;
  seasonFactor: number;
  weatherFactor: number;
}

export interface YieldEstimationResult {
  estimatedYield: number;       // kg per tree
  yieldRange: YieldRange;       // kg per tree
  confidence: number;           // 0–100
  factors: YieldFactors;
  /** Plain-language notes explaining what drove this specific result —
   *  generated by simple string templates, NOT by any AI model. This keeps
   *  the explanation layer just as deterministic and defensible as the math. */
  notes: string[];
}

// ─── Tunable constants (all named, all justified) ──────────────────────────

/**
 * BASE_YIELD_KG: the reference yield, in kg, for ONE mature (8–20 yr old),
 * fully healthy Carabao mango tree, in dry season, under normal temperature
 * and rainfall.
 *
 * Carabao (Manila) mango yield commonly cited in Philippine agricultural
 * extension material ranges roughly 8–25 kg/tree for smallholder, non-
 * intensively-managed orchards once mature, with well-managed commercial
 * trees reaching higher. We anchor the "ideal baseline" at the middle of
 * that commonly-cited range rather than the top, because:
 *   (a) the partner farm is a smallholder operation, not an intensively
 *       managed commercial estate, and
 *   (b) it is safer for a defendable estimate to under-promise than to
 *       project commercial-best-case numbers onto a typical farm.
 *
 * This is the ONE number in the whole model that is a judgment call rather
 * than a direct rule; it is called out explicitly here so it can be tuned
 * later (e.g. once the farm starts logging real harvests) without touching
 * any other logic.
 */
const BASE_YIELD_KG = 15.0;

/**
 * Width of the uncertainty band used to build yieldRange from estimatedYield.
 * A fixed ±15% band is used because, without a real historical dataset, we
 * cannot compute a statistically derived confidence interval — so instead of
 * pretending otherwise, we use a transparent fixed percentage and say so.
 * This percentage widens automatically for low-confidence cases (see
 * computeConfidence + buildRange below) to reflect that less reliable inputs
 * deserve a wider stated range, not a falsely precise one.
 */
const BASE_RANGE_PCT = 0.15;

// ─── Factor 1: Age ──────────────────────────────────────────────────────────
//
// RULE (horticultural fact, not an assumption):
// Mango trees follow a well-documented lifecycle:
//   • 0–2 yrs   : not yet fruit-bearing (juvenile phase)
//   • 3–4 yrs   : first sparse fruiting begins
//   • 5–7 yrs   : yield ramps up toward maturity
//   • 8–20 yrs  : peak bearing — this is the baseline (factor = 1.00)
//   • 21–30 yrs : yield gradually declines as the tree ages
//   • 30+ yrs   : old tree, yield significantly reduced
//
// This is implemented as a piecewise-linear curve rather than a single
// number, because real mango productivity-by-age curves are well known to
// be non-linear (S-shaped ramp-up, plateau, slow decline) and a step
// function or single multiplier would misrepresent very young or very old
// trees badly.
function computeAgeFactor(ageYears: number): number {
  if (ageYears <= 0) return 0; // not yet planted / invalid — no fruit possible
  if (ageYears <= 2) return 0.0; // juvenile, pre-bearing phase
  if (ageYears <= 4) {
    // Linear ramp from 0 (age 2) to 0.45 (age 4) — first sparse harvests
    return lerp(ageYears, 2, 4, 0.0, 0.45);
  }
  if (ageYears <= 7) {
    // Linear ramp from 0.45 (age 4) to 1.00 (age 7) — approaching maturity
    return lerp(ageYears, 4, 7, 0.45, 1.0);
  }
  if (ageYears <= 20) {
    // Peak bearing plateau
    return 1.0;
  }
  if (ageYears <= 30) {
    // Gradual decline from 1.00 (age 20) to 0.70 (age 30)
    return lerp(ageYears, 20, 30, 1.0, 0.7);
  }
  // Beyond 30 years: continue a slow decline, floored at 0.5 so an old but
  // still-living, still-producing tree is never estimated as worthless.
  return Math.max(0.5, lerp(ageYears, 30, 50, 0.7, 0.5));
}

// ─── Factor 2: Health ────────────────────────────────────────────────────────
//
// RULE:
// `healthStatus` in Firestore is binary today: a tree is either 'Healthy' or
// 'Infected'. We don't have a per-tree severity score, so we model health at
// the CLUSTER level using the fraction of trees currently healthy:
//
//   healthyFraction = healthyCount / totalCount        (0.0 – 1.0)
//
// healthFactor is a LINEAR function of healthyFraction: a fully-healthy
// cluster (fraction = 1.0) gets factor 1.00 (no penalty); a fully-infected
// cluster (fraction = 0.0) gets factor 0.30 — not zero, because even a
// cluster where every tree has been flagged "Infected" by the classifier
// will usually still bear some fruit (disease severity varies, and the
// binary flag doesn't mean "100% of the tree is non-productive").
//
// This is intentionally the SAME shape of curve (linear, floored) as the
// old continuous infectionFactor used — the difference is just that the
// input driving it is now an honest cluster-level headcount ratio instead
// of an invented per-tree severity number.
//
// ── FUTURE UPGRADE HOOK ──────────────────────────────────────────────────
// If you later add either of these to your schema:
//   (a) a continuous per-tree severity score (0.0–1.0, e.g. from CNN lesion
//       area or softmax confidence), or
//   (b) a three-state vigor tag (Healthy / Warning / Critical)
// ...replace the body of `computeHealthFactor` below with a richer
// calculation that uses that field directly (the same way the very first
// draft of this engine modeled `infectionRate` + `treeStatus` as separate
// multipliers). Nothing else in this file needs to change — `healthFactor`
// is consumed identically downstream regardless of how it's computed.
const HEALTH_FACTOR_FLOOR = 0.3; // worst case: cluster is 100% flagged "Infected"

function computeHealthFactor(healthyCount: number, totalCount: number): number {
  if (totalCount <= 0) return 1.0; // no trees recorded — don't apply a penalty we can't justify
  const healthyFraction = clamp(healthyCount / totalCount, 0, 1);
  return lerp(healthyFraction, 0, 1, HEALTH_FACTOR_FLOOR, 1.0);
}

// ─── Factor 3: Season ────────────────────────────────────────────────────────
//
// RULE (horticultural fact):
// Carabao mango in the Philippines has a well-documented natural fruiting
// cycle tied to the dry season: flower induction typically occurs during
// the dry months (roughly November–April in most of the Philippines,
// including Mindanao), with harvest following several months later.
// Wet-season conditions suppress flower induction and promote vegetative
// growth instead, and also raise fungal disease pressure during flowering
// (e.g. anthracnose), which independently reduces fruit set. This is why
// season is treated as a multiplier on its own, separate from the
// rainfall captured under the weather factor below — season reflects the
// FLOWERING-CYCLE timing effect, while weather reflects CURRENT
// environmental stress.
const SEASON_FACTORS: Record<Season, number> = {
  Dry: 1.0,   // baseline — aligns with natural flower-induction window
  Wet: 0.7,   // suppressed flowering / higher disease pressure
};

function computeSeasonFactor(season: Season): number {
  return SEASON_FACTORS[season] ?? 1.0;
}

/**
 * Auto-detects season from a calendar date, for farms that don't manually
 * tag season per reading. Mindanao (like most of the Philippines) generally
 * follows: dry season ≈ November–April, wet season ≈ May–October.
 * This is a simplification — Mindanao's eastern seaboard in particular can
 * have a less pronounced dry season than Luzon — so this auto-detect is
 * provided as a convenience default, and should be overridable per-farm if
 * the partner farm's actual local rainfall pattern differs.
 */
export function detectSeasonFromDate(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // 1–12
  const isDry = month === 11 || month === 12 || (month >= 1 && month <= 4);
  return isDry ? 'Dry' : 'Wet';
}

// ─── Factor 4: Weather (temperature + rainfall) ─────────────────────────────
//
// RULE:
// Mango trees have well-documented optimal ranges for fruit development:
//   • Temperature: roughly 24–30°C is considered favorable for fruit
//     development; temperatures much above ~35°C stress the tree and can
//     cause flower/fruit drop, while temperatures much below ~18°C slow
//     metabolic activity and delay fruit development.
//   • Rainfall: moderate rainfall supports fruit development, but heavy
//     rainfall during flowering/fruit-set promotes fungal disease and can
//     physically dislodge flowers and young fruit; conversely, very low
//     rainfall causes moisture stress.
//
// Both sub-factors are modeled as a "distance from an ideal band" penalty:
// inside the ideal band, factor = 1.00; the further outside the band
// (in either direction), the more the factor drops, down to a floor.
// Temperature and rainfall sub-factors are then averaged (not multiplied)
// because they represent two aspects of the same "current weather stress"
// concept rather than two fully independent risks — averaging avoids
// double-penalizing a tree for one moderately bad weather reading.
const IDEAL_TEMP_MIN_C = 24;
const IDEAL_TEMP_MAX_C = 30;
const TEMP_STRESS_FLOOR = 0.5; // worst-case temperature sub-factor

const IDEAL_RAIN_MIN_MM = 10; // weekly mm, avoids drought stress
const IDEAL_RAIN_MAX_MM = 50; // weekly mm, avoids excess/fungal pressure
const RAIN_STRESS_FLOOR = 0.5; // worst-case rainfall sub-factor

function computeWeatherFactor(temperatureC: number, rainfallMm: number): number {
  const tempFactor = bandPenalty(
    temperatureC,
    IDEAL_TEMP_MIN_C,
    IDEAL_TEMP_MAX_C,
    /* outerMin */ 10,
    /* outerMax */ 42,
    TEMP_STRESS_FLOOR,
  );

  const rainFactor = bandPenalty(
    rainfallMm,
    IDEAL_RAIN_MIN_MM,
    IDEAL_RAIN_MAX_MM,
    /* outerMin */ 0,
    /* outerMax */ 150,
    RAIN_STRESS_FLOOR,
  );

  return (tempFactor + rainFactor) / 2;
}

/**
 * Generic "ideal band" penalty curve, reused for both temperature and
 * rainfall above. Returns 1.0 if `value` falls inside [idealMin, idealMax].
 * Outside the band, factor decreases linearly toward `floor` as the value
 * approaches outerMin (below) or outerMax (above). This is a simple,
 * explainable shape (flat-top trapezoid) — easy to draw on a whiteboard
 * during a defense — rather than a statistically fitted curve.
 */
function bandPenalty(
  value: number,
  idealMin: number,
  idealMax: number,
  outerMin: number,
  outerMax: number,
  floor: number,
): number {
  if (value >= idealMin && value <= idealMax) return 1.0;
  if (value < idealMin) {
    return lerp(clamp(value, outerMin, idealMin), outerMin, idealMin, floor, 1.0);
  }
  // value > idealMax
  return lerp(clamp(value, idealMax, outerMax), idealMax, outerMax, 1.0, floor);
}

// ─── Confidence ──────────────────────────────────────────────────────────────
//
// RULE:
// Confidence here means "how much do we trust this particular estimate,"
// NOT "how accurate is our model" (we have no historical data to validate
// accuracy against — being honest about that is part of why this is
// "estimation," not "prediction"). Confidence is built from two
// independent, explainable components:
//
//   1. DATA COMPLETENESS (70% weight): did every required input actually
//      arrive with a plausible value, or are we filling in defaults for
//      missing weather data, an unset season, an empty cluster, etc.?
//      More real inputs = higher trust in the resulting number.
//
//   2. CONDITION STABILITY (30% weight): clusters in extreme states (very
//      young trees, very low healthy-fraction) are inherently harder to
//      estimate confidently than a typical mature, mostly-healthy cluster,
//      because they sit further from the well-documented "normal" case the
//      baseline assumptions describe. A moderate, typical cluster gets the
//      highest confidence; an extreme case gets a lower confidence even
//      with complete data, because the rule curves themselves are least
//      well-validated at the extremes.
//
// The result is scaled to 0–100 and capped, since a rule-based system with
// no ground-truth validation should never claim to be more than "highly
// confident" — never absolute certainty.
const MAX_CONFIDENCE = 90;
const MIN_CONFIDENCE = 30;

function computeConfidence(
  factors: YieldFactors,
  completeness: DataCompleteness,
): number {
  // 1. Data completeness score (0–1): fraction of fields that were supplied
  //    with real (non-default/non-placeholder) values.
  const completenessScore = completeness.suppliedCount / completeness.totalCount;

  // 2. Condition stability score (0–1): how close the cluster's combined
  //    multiplier set is to the "typical, well-understood" middle of each
  //    factor's range, vs. an extreme edge.
  const ageStability = 1 - Math.abs(factors.ageFactor - 1.0); // closer to 1.0 = more typical
  const healthStability = factors.healthFactor; // closer to 1.0 = more typical (mostly healthy)
  const stabilityScore = clamp((ageStability + healthStability) / 2, 0, 1);

  const raw = completenessScore * 0.7 + stabilityScore * 0.3;

  const confidence = Math.round(MIN_CONFIDENCE + raw * (MAX_CONFIDENCE - MIN_CONFIDENCE));
  return clamp(confidence, MIN_CONFIDENCE, MAX_CONFIDENCE);
}

interface DataCompleteness {
  suppliedCount: number;
  totalCount: number;
  missingFields: string[];
}

function isUsableNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Checks which of the required fields were actually supplied with usable
 * values vs. left at a default/placeholder. Called BEFORE estimation so the
 * caller can pass real values where available; this just measures what
 * arrived. Treated as its own function so the completeness check is visible
 * and auditable on its own, independent of the math.
 */
function assessCompleteness(input: Partial<YieldEstimationInput>): DataCompleteness {
  const checks: Array<[string, boolean]> = [
    ['treeAgeYears', isUsableNumber(input.treeAgeYears) && input.treeAgeYears > 0],
    ['healthCounts', isUsableNumber(input.totalCount) && input.totalCount > 0 && isUsableNumber(input.healthyCount)],
    ['season', !!input.season],
    ['weather', isUsableNumber(input.temperatureC) && isUsableNumber(input.rainfallMm)],
  ];

  const missingFields = checks.filter(([, ok]) => !ok).map(([name]) => name);

  return {
    suppliedCount: checks.length - missingFields.length,
    totalCount: checks.length,
    missingFields,
  };
}

// ─── Range construction ──────────────────────────────────────────────────────
//
// RULE:
// The stated min/max range widens as confidence drops — a low-confidence
// estimate should visibly look less precise, not just carry a smaller
// number next to it. We linearly scale the ±% band from BASE_RANGE_PCT
// (at max confidence) up to 2× that (at min confidence).
function buildRange(estimatedYield: number, confidence: number): YieldRange {
  const confidenceRatio = (confidence - MIN_CONFIDENCE) / (MAX_CONFIDENCE - MIN_CONFIDENCE); // 0..1
  const rangePct = lerp(confidenceRatio, 0, 1, BASE_RANGE_PCT * 2, BASE_RANGE_PCT);

  return {
    min: round1(Math.max(0, estimatedYield * (1 - rangePct))),
    max: round1(estimatedYield * (1 + rangePct)),
  };
}

// ─── Explanatory notes (template-based, not AI-generated) ──────────────────
//
// These are plain string templates that point at whichever factor most
// reduced the estimate, so the UI can show a "why" without calling any
// external model. This intentionally replaces the old Claude-explanation
// API call — the formula is already simple enough to narrate directly.
function buildNotes(factors: YieldFactors, input: YieldEstimationInput, completeness: DataCompleteness): string[] {
  const notes: string[] = [];

  const entries: Array<[string, number]> = [
    ['tree age', factors.ageFactor],
    ['cluster health', factors.healthFactor],
    ['season', factors.seasonFactor],
    ['current weather', factors.weatherFactor],
  ];
  const lowest = entries.reduce((a, b) => (b[1] < a[1] ? b : a));

  if (lowest[1] < 0.9) {
    notes.push(`The biggest factor reducing this estimate is ${lowest[0]} (factor ${lowest[1].toFixed(2)}).`);
  } else {
    notes.push('All factors are close to baseline — this cluster is estimated near typical conditions.');
  }

  if (input.totalCount > 0) {
    const pct = Math.round((input.healthyCount / input.totalCount) * 100);
    notes.push(`${input.healthyCount} of ${input.totalCount} trees (${pct}%) are currently classified Healthy.`);
  }

  if (input.season === 'Wet') {
    notes.push('Wet season suppresses flower induction for Carabao mango; expect lower fruit set than dry season.');
  }

  if (factors.healthFactor < 0.6) {
    notes.push('A high proportion of infected trees is substantially reducing this estimate — treatment is likely to improve next season\'s figure.');
  }

  if (completeness.missingFields.length > 0) {
    notes.push(`Estimate confidence is reduced because the following data was unavailable: ${completeness.missingFields.join(', ')}.`);
  }

  return notes;
}

// ─── Math helpers ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation of `value` from range [x0, x1] to range [y0, y1]. */
function lerp(value: number, x0: number, x1: number, y0: number, y1: number): number {
  if (x1 === x0) return y0;
  const t = clamp((value - x0) / (x1 - x0), 0, 1);
  return y0 + t * (y1 - y0);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Computes a transparent, rule-based yield estimate for one cluster.
 *
 * This is the ONLY function the UI needs to call. Everything above is
 * either a pure helper or a documented constant.
 */
export function estimateYield(input: YieldEstimationInput): YieldEstimationResult {
  const completeness = assessCompleteness(input);

  // Defensive defaults: if temperature/rainfall/age arrive as NaN, undefined,
  // or otherwise unusable (e.g. WeatherService failed, or a brand-new
  // cluster has no trees yet), we fall back to NEUTRAL values rather than
  // letting NaN propagate through the multiplication and silently corrupting
  // the whole estimate. The missing data is still flagged via
  // `completeness`/`notes` and reflected in a lower confidence score — the
  // user sees "we don't have weather data" instead of a broken number.
  const safeTemperatureC = isUsableNumber(input.temperatureC) ? input.temperatureC : (IDEAL_TEMP_MIN_C + IDEAL_TEMP_MAX_C) / 2;
  const safeRainfallMm = isUsableNumber(input.rainfallMm) ? input.rainfallMm : (IDEAL_RAIN_MIN_MM + IDEAL_RAIN_MAX_MM) / 2;
  const safeAgeYears = isUsableNumber(input.treeAgeYears) ? input.treeAgeYears : 0;
  const safeHealthyCount = isUsableNumber(input.healthyCount) ? input.healthyCount : 0;
  const safeTotalCount = isUsableNumber(input.totalCount) ? input.totalCount : 0;

  const factors: YieldFactors = {
    ageFactor: round2(computeAgeFactor(safeAgeYears)),
    healthFactor: round2(computeHealthFactor(safeHealthyCount, safeTotalCount)),
    seasonFactor: round2(computeSeasonFactor(input.season)),
    weatherFactor: round2(computeWeatherFactor(safeTemperatureC, safeRainfallMm)),
  };

  const rawYield =
    BASE_YIELD_KG *
    factors.ageFactor *
    factors.healthFactor *
    factors.seasonFactor *
    factors.weatherFactor;

  const estimatedYield = round1(rawYield);
  const confidence = computeConfidence(factors, completeness);
  const yieldRange = buildRange(estimatedYield, confidence);
  const notes = buildNotes(factors, input, completeness);

  return { estimatedYield, yieldRange, confidence, factors, notes };
}

// ─── Cluster-level aggregation ───────────────────────────────────────────────

export interface ClusterYieldInput {
  clusterId: string;
  clusterName: string;
  treeCount: number;
  input: YieldEstimationInput;
}

export interface ClusterYieldResult extends YieldEstimationResult {
  clusterId: string;
  clusterName: string;
  treeCount: number;
  totalEstimatedYield: number; // estimatedYield × treeCount
}

export function estimateClusterYield(cluster: ClusterYieldInput): ClusterYieldResult {
  const base = estimateYield(cluster.input);
  return {
    ...base,
    clusterId: cluster.clusterId,
    clusterName: cluster.clusterName,
    treeCount: cluster.treeCount,
    totalEstimatedYield: round1(base.estimatedYield * cluster.treeCount),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// ADAPTER: building YieldEstimationInput directly from a tree-service.ts
// cluster document
// ════════════════════════════════════════════════════════════════════════════
//
// `_updateClusterStats` in tree-service.ts already writes, per cluster doc:
//   treeCount, healthyCount, infectedCount, avgAge, avgInfectionRate, ...
//
// This adapter maps those fields directly onto YieldEstimationInput, so you
// don't have to re-derive healthyCount/totalCount by hand at the call site.
// Pass season/weather in separately since tree-service.ts has no knowledge
// of the WeatherService.
export interface ClusterStatsDoc {
  treeCount: number;
  healthyCount: number;
  avgAge: number;
  [key: string]: any; // infectedCount, avgInfectionRate, etc. — unused here
}

export function buildInputFromClusterStats(
  cluster: ClusterStatsDoc,
  weather: { temperatureC?: number | null; rainfallMm?: number | null } | null,
  season?: Season,
): YieldEstimationInput {
  return {
    treeAgeYears: cluster.avgAge ?? 0,
    healthyCount: cluster.healthyCount ?? 0,
    totalCount: cluster.treeCount ?? 0,
    season: season ?? detectSeasonFromDate(),
    temperatureC: weather?.temperatureC ?? NaN,
    rainfallMm: weather?.rainfallMm ?? NaN,
  };
}