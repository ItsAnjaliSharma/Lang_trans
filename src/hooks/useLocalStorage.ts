'use client';

import { useState, useEffect, useCallback } from 'react';

// A helper function to safely read from localStorage
function readValueFromStorage<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') {
    return initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // The `useState` initializer function will only be executed once, on the initial render.
  // This is the key to preventing the re-render loop.
  const [storedValue, setStoredValue] = useState<T>(() => readValueFromStorage(key, initialValue));

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Dispatch a custom event to notify other tabs/windows of the change
        window.dispatchEvent(new Event('local-storage'));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent | Event) => {
      // For 'storage' event, check if the key matches
      if (event instanceof StorageEvent && event.key !== key) {
        return;
      }
      setStoredValue(readValueFromStorage(key, initialValue));
    };

    // Listen to changes from other tabs
    window.addEventListener('storage', handleStorageChange);
    // Listen to changes from the same tab (dispatched by setValue)
    window.addEventListener('local-storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}
