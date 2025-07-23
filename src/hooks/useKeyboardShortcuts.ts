import { useEffect } from 'react';

export const useKeyboardShortcuts = (onUndo: () => void, onRedo: () => void) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check for Ctrl+Z (Undo)
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        onUndo();
      }
      // Check for Ctrl+Y or Ctrl+Shift+Z (Redo)
      else if (
        (event.ctrlKey && event.key === 'y') ||
        (event.ctrlKey && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        onRedo();
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [onUndo, onRedo]);
};
