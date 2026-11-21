import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTryAlternateModel,
  isTransientOverload,
  mapGeminiError,
  resolveAttemptTimeoutMs,
} from './matchChatServer.ts';

test('resolveAttemptTimeoutMs gives generous budget to primary model and extra time for images', () => {
  const primaryText = resolveAttemptTimeoutMs({
    model: 'gemini-4-hydrogen',
    hasImages: false,
    attemptIndex: 0,
  });
  const primaryImage = resolveAttemptTimeoutMs({
    model: 'gemini-4-hydrogen',
    hasImages: true,
    attemptIndex: 0,
  });
  const fallbackText = resolveAttemptTimeoutMs({
    model: 'gemini-3.1-flash-lite',
    hasImages: false,
    attemptIndex: 1,
  });

  assert.ok(primaryText >= 12_000 && primaryText <= 20_000, `Expected 12-20s for primary text, got ${primaryText}`);
  assert.ok(primaryImage > primaryText, 'Image requests should receive a larger timeout budget');
  assert.ok(fallbackText >= 20_000, `Expected >= 20s for fallback, got ${fallbackText}`);
});

test('isTransientOverload and canTryAlternateModel classify timeouts and auth errors accurately', () => {
  const timeoutErr = new Error('DEADLINE_EXCEEDED: model timed out after 35s');
  assert.equal(isTransientOverload(timeoutErr), true);
  assert.equal(canTryAlternateModel(timeoutErr), true);

  const authErr = new Error('API_KEY_INVALID');
  assert.equal(isTransientOverload(authErr), false);
  assert.equal(canTryAlternateModel(authErr), false);

  const emptyErr = new Error('Empty response from model');
  assert.equal(canTryAlternateModel(emptyErr), true);
});

test('mapGeminiError maps deadline exceeded to safe HTTP 429 localized message', () => {
  const mapped = mapGeminiError(new Error('DEADLINE_EXCEEDED: model timed out after 35s'), 'az');
  assert.equal(mapped.status, 429);
  assert.ok(mapped.message.includes('yüklənmə'));
});
