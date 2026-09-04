import { useState, useCallback } from 'react';

/**
 * Reusable toast notification hook.
 * Replaces the duplicated `toastMessage + setTimeout` pattern found in 7+ components.
 *
 * @param {number} duration - Auto-dismiss delay in ms (default: 3000)
 * @returns {[{msg: string, type: string}|null, (msg: string, type?: string) => void, () => void]}
 */
export function useToast(duration = 3000) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (msg, type = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  const clearToast = useCallback(() => setToast(null), []);

  return [toast, showToast, clearToast];
}
