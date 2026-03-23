import '@testing-library/jest-dom'

// Suppress known React/Radix warnings that occur in tests (refs, act)
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : String(args[0]);
  if (
    msg.includes('forwardRef') ||
    msg.includes('SlotClone') ||
    msg.includes('wrap-tests-with-act') ||
    msg.includes('act(...)')
  ) {
    return;
  }
  originalError.apply(console, args);
};

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : String(args[0]);
  if (msg.includes('forwardRef') || msg.includes('SlotClone')) {
    return;
  }
  originalWarn.apply(console, args);
};

const noop = () => {};
if (typeof HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = noop;
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = noop;
  }
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = noop;
}
