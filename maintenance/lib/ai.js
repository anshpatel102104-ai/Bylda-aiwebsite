'use strict';

const { ai } = require('../config');

/** Is a Claude API key available in the environment? */
function isAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/**
 * Run a single Claude completion and return the text.
 *
 * Streams the response (recommended for long output / high max_tokens) and
 * uses adaptive thinking. Returns null if no API key is configured so callers
 * can degrade gracefully to a template-only report.
 */
async function analyze({ system, prompt, maxTokens = ai.maxTokens }) {
  if (!isAvailable()) return null;

  // Lazily require so the SEO/design audits don't need the SDK installed.
  let Anthropic;
  try {
    Anthropic = require('@anthropic-ai/sdk');
  } catch (_) {
    console.warn('  @anthropic-ai/sdk not installed — skipping AI analysis.');
    return null;
  }

  const client = new Anthropic();
  try {
    const stream = client.messages.stream({
      model: ai.model,
      max_tokens: maxTokens,
      thinking: { type: 'adaptive' },
      system,
      messages: [{ role: 'user', content: prompt }],
    });
    const message = await stream.finalMessage();
    return message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
  } catch (e) {
    console.warn(`  Claude analysis failed: ${e.message}`);
    return null;
  }
}

module.exports = { isAvailable, analyze, model: ai.model };
