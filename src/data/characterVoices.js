// Character → Gemini 3.1 Flash TTS voice casting.
//
// Gemini exposes 30 prebuilt voices so every one of our 12 characters
// can have a unique voice (unlike OpenAI's 6, which forced doubling up).
// Each voice has a published character hint in Google's docs — picks
// below are matched to the persona from scenarios.js.
//
// Voice name reference (from Google's speech-generation docs):
//   Charon      — warm, informative (barista archetype)
//   Rasalgethi  — informative, measured
//   Gacrux      — mature, unhurried
//   Alnilam     — firm, grounded
//   Iapetus     — clear, refined
//   Fenrir      — excitable, animated
//   Achird      — friendly, casual
//   Aoede       — breezy, bright (female)
//   Erinome     — clear, polished (female)
//   Sulafat     — warm, expressive (female)
//   Laomedeia   — upbeat (female)
//   Vindemiatrix — gentle (female)
//
// `styleHint` (optional) is a short direction string that gets prefixed
// to every TTS request for that character — e.g. "Warm Milanese barista".
// Gemini 3.1 interprets it as delivery direction, not spoken text.

export const CHARACTER_VOICES = {
  // Male characters
  Marco:       { voice: 'Charon',     styleHint: 'Warm Milanese barista, efficient, dry humor' },
  Davide:      { voice: 'Rasalgethi', styleHint: 'Helpful transit worker, patient and clear' },
  Lorenzo:     { voice: 'Gacrux',     styleHint: 'Older trattoria host, unhurried, generous' },
  Giuseppe:    { voice: 'Alnilam',    styleHint: 'Match-day stadium vendor, firm and streetwise' },
  Alessandro:  { voice: 'Iapetus',    styleHint: 'Refined fine-dining sommelier, precise and elegant' },
  Paolo:       { voice: 'Fenrir',     styleHint: 'Enthusiastic Milan football fan, animated' },
  Luca:        { voice: 'Achird',     styleHint: 'Young Milanese at a bar, casual and friendly' },

  // Female characters
  Giulia:      { voice: 'Aoede',        styleHint: 'Warm hotel receptionist, professional and bright' },
  Sofia:       { voice: 'Laomedeia',    styleHint: 'Cool, confident Navigli bartender, young' },
  Francesca:   { voice: 'Erinome',      styleHint: 'Polished tourist-info host, clear and patient' },
  Rosa:        { voice: 'Sulafat',      styleHint: 'Expressive older market vendor, warm and generous' },
  Valentina:   { voice: 'Vindemiatrix', styleHint: 'Elegant boutique shop owner, poised and unhurried' },
};

// San Siro scenario registers the character as "Vendor / Giuseppe" — normalize
// down to the lookup key.
const ALIASES = {
  'Vendor / Giuseppe': 'Giuseppe',
};

export function getVoiceFor(characterName) {
  if (!characterName) return null;
  const normalized = ALIASES[characterName] || characterName;
  return CHARACTER_VOICES[normalized] || null;
}
