import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * Stack of hardware-back handlers (last registered = highest priority).
 * Each returns true if the event was handled (prevents app exit).
 */
type BackFn = () => boolean;

const handlerStack: BackFn[] = [];
let subscribed = false;
let subscription: { remove: () => void } | null = null;

function ensureSubscription() {
  if (subscribed) return;
  subscribed = true;
  subscription = BackHandler.addEventListener('hardwareBackPress', () => {
    for (let i = handlerStack.length - 1; i >= 0; i -= 1) {
      if (handlerStack[i]()) return true;
    }
    return false;
  });
}

function pushHandler(fn: BackFn) {
  ensureSubscription();
  handlerStack.push(fn);
  return () => {
    const idx = handlerStack.lastIndexOf(fn);
    if (idx >= 0) handlerStack.splice(idx, 1);
  };
}

/**
 * Wire Android / system back to the same action as the in-app header back.
 * When `onBack` is set, the hardware back button invokes it and does not exit the app.
 */
export function useHardwareBack(onBack?: (() => void) | null) {
  const ref = useRef(onBack);
  ref.current = onBack;

  useEffect(() => {
    if (!onBack) return;
    return pushHandler(() => {
      ref.current?.();
      return true;
    });
  }, [Boolean(onBack)]);
}

/**
 * Lower-priority fallback (e.g. navigation history). Runs only when no
 * screen-level `useHardwareBack` handler consumed the event.
 * Return true to handle, false to allow default (exit app).
 */
export function useHardwareBackFallback(handler: () => boolean) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    ensureSubscription();
    const fn: BackFn = () => ref.current();
    // Keep fallback under screen handlers (child effects register first, then
    // this parent would otherwise sit on top if we only used push).
    handlerStack.unshift(fn);
    return () => {
      const idx = handlerStack.indexOf(fn);
      if (idx >= 0) handlerStack.splice(idx, 1);
    };
  }, []);
}
