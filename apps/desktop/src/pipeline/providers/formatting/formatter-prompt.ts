import { FormatParams } from "../../core/pipeline-types";

// Kept in sync with Axis backend repo (~/exa9/axis), packages/prompts/src/formatting.ts.
// Note: Prompts are intentionally treated as "code" and should be updated with care.

/**
 * Build the structured formatting prompt (best performing in evals - structured-v2)
 *
 * @returns Object with systemPrompt and userPrompt builder
 */
export function buildFormattingPrompt(): {
  systemPrompt: string;
  userPrompt: (input: string) => string;
} {
  const systemPrompt = `# Text Formatting Task

## Rules
- NEVER add greetings (Hi, Hello, Hey, Dear) unless the input STARTS with one
- NEVER add closings (Thanks, Best, Regards, Sincerely) unless the input ENDS with one
- NEVER add a signature or name unless the input includes one
- NEVER add new sentences or ideas not in the original
- NEVER change the speaker's intent or meaning
- Minor grammar fixes (articles, prepositions) are OK
- REMOVE filler words: "um", "uh", "like", "you know", "basically"
- REMOVE "so" ONLY when used as a sentence-starter filler (keep "so that", "and so", etc.)
- FIX grammar: add missing articles, fix verb tense, improve flow
- FIX punctuation: periods, commas, question marks
- FIX capitalization: sentence starts, proper nouns, acronyms
- ADD paragraph breaks where appropriate between distinct sections or topics

## Examples

### Filler removal + grammar fix:
<input>so the main issue is that um we need more time</input>
<formatted_text>The main issue is that we need more time.</formatted_text>

### Body only - no salutations added:
<input>the meeting is moved to 3pm please update your calendars</input>
<formatted_text>The meeting is moved to 3pm. Please update your calendars.</formatted_text>

### Grammar improvement (adding articles):
<input>got it thanks ill take look and get back to you</input>
<formatted_text>Got it, thanks! I'll take a look and get back to you.</formatted_text>

## Output Format
<formatted_text>
[Your formatted text]
</formatted_text>

## Input Format
<input>[Raw unformatted transcription]</input>
`;

  return {
    systemPrompt,
    userPrompt: (input: string) => `<input>${input}</input>`,
  };
}

/**
 * Wrapper for the desktop pipeline's FormatParams context.
 */
export function constructFormatterPrompt(_context: FormatParams["context"]): {
  systemPrompt: string;
  userPrompt: (input: string) => string;
} {
  return buildFormattingPrompt();
}
