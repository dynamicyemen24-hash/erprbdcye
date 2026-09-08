/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — useCommandPalette Hook
 * Registers global ⌘K shortcut and manages command palette state
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CommandItem } from '../components/CommandPalette';

export interface UseCommandPaletteOptions {
  items?: CommandItem[];
  onOpen?: () => void;
  onClose?: () => void;
}

export interface UseCommandPaletteReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  items: CommandItem[];
  addItem: (item: CommandItem) => void;
  removeItem: (id: string) => void;
  setItems: (items: CommandItem[]) => void;
}

export function useCommandPalette(options: UseCommandPaletteOptions = {}): UseCommandPaletteReturn {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CommandItem[]>(options.items || []);
  const onOpenRef = useRef(options.onOpen);
  const onCloseRef = useRef(options.onClose);
  onOpenRef.current = options.onOpen;
  onCloseRef.current = options.onClose;

  const toggle = useCallback(() => setOpen((v) => !v), []);

  const handleSetOpen = useCallback(
    (v: boolean) => {
      setOpen(v);
      if (v) onOpenRef.current?.();
      else onCloseRef.current?.();
    },
    []
  );

  // Global ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleSetOpen(!open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, handleSetOpen]);

  const addItem = useCallback((item: CommandItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { open, setOpen: handleSetOpen, toggle, items, addItem, removeItem, setItems };
}
