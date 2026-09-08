/**
 * useDisclosure — Open/close/toggle state with callbacks
 * Adapted from NICYE design-system hooks/useDisclosure.ts
 */

import { useCallback, useState } from 'react';

export interface UseDisclosureOptions {
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface UseDisclosureReturn {
  isOpen: boolean;
  open: boolean;
  setOpen: (value: boolean) => void;
  openDisclosure: () => void;
  closeDisclosure: () => void;
  toggleDisclosure: () => void;
}

export function useDisclosure({
  defaultOpen = false,
  onOpen,
  onClose,
}: UseDisclosureOptions = {}): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const openDisclosure = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const closeDisclosure = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggleDisclosure = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) onClose?.();
      else onOpen?.();
      return !prev;
    });
  }, [onOpen, onClose]);

  const setOpen = useCallback(
    (value: boolean) => {
      if (value) openDisclosure();
      else closeDisclosure();
    },
    [openDisclosure, closeDisclosure]
  );

  return { isOpen, open: isOpen, setOpen, openDisclosure, closeDisclosure, toggleDisclosure };
}
