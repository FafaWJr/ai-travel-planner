// scripts/i18n-check/shared/accent-rules.mjs
//
// Authoritative list of PT-BR accent rules for Luna Let's Go.
// Source of truth: luna-architecture skill, Section 6.
// Used by: Layer 1 deterministic checker, and future luna-multilang-translator.
//
// Do not add accents loosely here. Every entry was added because the
// unaccented form is a real error that has shipped at some point.

/**
 * Words that MUST have their accent in any PT-BR translation.
 * Detection is case-insensitive. A PT-BR string containing the
 * unaccented form without the accented form anywhere else is a failure.
 */
export const REQUIRED_ACCENTS_PT_BR = [
  { unaccented: 'voce',        accented: 'você' },
  { unaccented: 'nao',         accented: 'não' },
  { unaccented: 'e',           accented: 'é',           context: 'ser-verb' }, // Special case, see below
  { unaccented: 'esta',        accented: 'está',        context: 'ser-verb' }, // Could also be "esta" (demonstrative), see below
  { unaccented: 'so',          accented: 'só' },
  { unaccented: 'ja',          accented: 'já' },
  { unaccented: 'gratis',      accented: 'grátis' },
  { unaccented: 'orcamento',   accented: 'orçamento' },
  { unaccented: 'opcoes',      accented: 'opções' },
  { unaccented: 'sugestoes',   accented: 'sugestões' },
  { unaccented: 'hoteis',      accented: 'hotéis' },
  { unaccented: 'estacoes',    accented: 'estações' },
  { unaccented: 'preferencias', accented: 'preferências' },
  { unaccented: 'localizacao', accented: 'localização' },
  { unaccented: 'confianca',   accented: 'confiança' },
  { unaccented: 'distancia',   accented: 'distância' },
  { unaccented: 'alimentacao', accented: 'alimentação' },
  { unaccented: 'horarios',    accented: 'horários' },
  { unaccented: 'inicio',      accented: 'início' },
  { unaccented: 'unico',       accented: 'único' },
  { unaccented: 'proxima',     accented: 'próxima' },
  { unaccented: 'comeca',      accented: 'começa' },
  { unaccented: 'Japao',       accented: 'Japão' },
  { unaccented: 'Toquio',      accented: 'Tóquio' },
  { unaccented: 'India',       accented: 'Índia' },
  { unaccented: 'manha',       accented: 'manhã' },
  { unaccented: 'almocos',     accented: 'almoços' },
  { unaccented: 'sao',         accented: 'são',         context: 'ser-verb' },
  { unaccented: 'familia',     accented: 'família' },
  { unaccented: 'criancas',    accented: 'crianças' },
  { unaccented: 'economico',   accented: 'econômico' },
  { unaccented: 'romanticas',  accented: 'românticas' },
  { unaccented: 'programacao', accented: 'programação' },
  { unaccented: 'taxis',       accented: 'táxis' },
  { unaccented: 'ate',         accented: 'até' },
];

/**
 * Bare "e" detector. In PT-BR, "e" can mean "and" (correct) or be
 * a mistaken lowercase for "é" (is/to be). A translation with a bare
 * " e " in a context where "ser" (to be) is expected is a failure.
 *
 * Heuristic: a bare "e" followed by common "ser" complements like
 * "um", "uma", "o", "a", "muito", "uma experiência", etc., is
 * likely a missed accent.
 */
export const SER_VERB_TRAPS_PT_BR = [
  /\be\s+(?:um|uma|o|a|muito|muita|sempre|realmente|essencial|importante|possivel|possível|gratis|grátis|necessário|ótimo|ótima)\b/i,
  /\be\s+(?:por\s+isso|claro|fundamental|comum|típico|típica|raro|rara)\b/i,
  /(?:^|[.!?]\s+)E\s+(?:um|uma|o|a|muito|muita|essencial|importante|possivel|possível|gratis|grátis)\b/,
];

/**
 * "a" before feminine nouns should contract to "à".
 * Common feminine nouns in Luna context: Luna, viagem, família, cidade, praia, etc.
 *
 * Heuristic: " a " (preposition) immediately before one of these nouns
 * when the sentence structure implies a dative/directional sense.
 */
export const CRASIS_TRAPS_PT_BR = [
  /\ba\s+(?:Luna|viagem|família|cidade|praia|estação|experiência|aventura|chegada|partida)\b/i,
];

/**
 * Proper nouns that must NEVER be translated, regardless of locale.
 * These preserve brand identity and persona names.
 */
export const PROTECTED_NOUNS = [
  "Luna Let's Go",
  "Luna",
  "The Explorer",
  "The Foodie",
  "The Relaxer",
  "The Photographer",
  "The Culture Seeker",
  "The Adventurer",
  "The Luxury Traveller",
  "The Family Planner",
  "The Romantic",
  "The Solo Wanderer",
  "The Party Animal",
  "The Festival Chaser",
  "The Sun Seeker",
];

/**
 * Length sanity bounds.
 * A translation longer or shorter than this factor of the English source
 * is suspicious (either a hallucination or an empty/truncated response).
 */
export const LENGTH_BOUNDS = {
  minRatio: 0.6, // Translation can be 40% shorter (some languages are terser)
  maxRatio: 1.8, // Translation can be 80% longer (PT-BR often expands)
};
