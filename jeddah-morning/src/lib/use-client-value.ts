"use client";
import { useSyncExternalStore } from "react";

const noopSubscribe: (cb: () => void) => () => void = () => () => {};

/**
 * Read a browser-only value (localStorage, feature detection) without hydration mismatches:
 * the server snapshot is used for SSR and hydration, then the client value takes over.
 * The getter must return a primitive so snapshots compare by value.
 */
export function useClientValue<T extends string | number | boolean | null>(getter: () => T, serverValue: T, subscribe: (cb: () => void) => () => void = noopSubscribe): T {
  return useSyncExternalStore(subscribe, getter, () => serverValue);
}

export function safeLocalGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
