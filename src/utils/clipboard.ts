/**
 * Safe clipboard helper with feature detection and fallback to execCommand.
 * Prevents unhandled rejections in restricted browser sandboxes or iframes.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Primary: Modern Async Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] navigator.clipboard.writeText threw, attempting fallback:', err);
    }
  }

  // Fallback: execCommand via temporary hidden textarea
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.setAttribute('readonly', '');
      textarea.setAttribute('aria-hidden', 'true');
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (success) {
        return true;
      }
    } catch (fallbackErr) {
      console.warn('[Clipboard] execCommand fallback failed:', fallbackErr);
    }
  }

  return false;
}
