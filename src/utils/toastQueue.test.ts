import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampToastDuration,
  DEFAULT_TOAST_DURATION_MS,
  dismissToast,
  enqueueToast,
  MAX_TOAST_DURATION_MS,
  MIN_TOAST_DURATION_MS,
  type ToastItem,
} from './toastQueue';

test('clampToastDuration enforces safe min/max bounds and defaults', () => {
  assert.equal(clampToastDuration(undefined), DEFAULT_TOAST_DURATION_MS);
  assert.equal(clampToastDuration(Number.NaN), DEFAULT_TOAST_DURATION_MS);
  assert.equal(clampToastDuration(500), MIN_TOAST_DURATION_MS);
  assert.equal(clampToastDuration(90_000), MAX_TOAST_DURATION_MS);
  assert.equal(clampToastDuration(5200), 5200);
});

test('enqueueToast appends notifications and ignores empty messages', () => {
  const empty = enqueueToast([], { variant: 'error', title: '   ', message: ' ' });
  assert.equal(empty.length, 0);

  const list = enqueueToast(
    [],
    {
      id: 't1',
      variant: 'error',
      title: 'Chat service error',
      message: 'Rate limit reached',
      durationMs: 6000,
    },
    { now: 1000 }
  );
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 't1');
  assert.equal(list[0].createdAt, 1000);
});

test('enqueueToast deduplicates identical active error toasts and refreshes timestamp', () => {
  const first = enqueueToast(
    [],
    {
      id: 't1',
      variant: 'error',
      title: 'Chat error',
      message: 'Service busy',
    },
    { now: 1000 }
  );

  const second = enqueueToast(
    first,
    {
      id: 't2',
      variant: 'error',
      title: 'Chat error',
      message: 'Service busy',
    },
    { now: 2500 }
  );

  assert.equal(second.length, 1);
  assert.equal(second[0].id, 't2');
  assert.equal(second[0].createdAt, 2500);
});

test('enqueueToast caps visible stack to maxVisible by dropping oldest toast', () => {
  let list: ToastItem[] = [];
  for (let i = 1; i <= 5; i += 1) {
    list = enqueueToast(
      list,
      {
        id: `t-${i}`,
        variant: 'error',
        title: `Error ${i}`,
        message: `Message ${i}`,
      },
      { maxVisible: 3, now: i * 1000 }
    );
  }
  assert.deepEqual(
    list.map((t) => t.id),
    ['t-3', 't-4', 't-5']
  );
});

test('dismissToast removes only the matching toast id', () => {
  let list: ToastItem[] = [];
  list = enqueueToast(list, { id: 'a', variant: 'error', title: 'A', message: 'Msg A' });
  list = enqueueToast(list, { id: 'b', variant: 'warning', title: 'B', message: 'Msg B' });
  const after = dismissToast(list, 'a');
  assert.deepEqual(
    after.map((t) => t.id),
    ['b']
  );
});
