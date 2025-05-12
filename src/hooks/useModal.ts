
import { useState, useCallback } from 'react';
import { PostData } from '@/types';

export function useModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(-1);

  const openModal = useCallback((index: number) => {
    if (index >= 0) {
      setCurrentModalIndex(index);
      setModalOpen(true);
    }
  }, []);
  
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);
  
  const navigateModal = useCallback((newIndex: number) => {
    setCurrentModalIndex(newIndex);
  }, []);

  return {
    modalOpen,
    currentModalIndex,
    openModal,
    closeModal,
    navigateModal
  };
}
