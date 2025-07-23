import { useEffect, useRef, useCallback } from 'react';
import { File, Local } from '../components/Storage/LocalStorage';
import * as AppGeneral from '../components/socialcalc/index.js';

interface AutoSaveConfig {
  intervalMs?: number;
  enabled?: boolean;
  onSave?: (fileName: string) => void;
  onError?: (error: string) => void;
}

export const useAutoSave = (
  store: Local,
  currentFile: string,
  billType: number,
  config: AutoSaveConfig = {}
) => {
  const {
    intervalMs = 30000, // Default: 30 seconds
    enabled = true,
    onSave,
    onError
  } = config;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');
  const isAutoSavingRef = useRef<boolean>(false);

  const performAutoSave = useCallback(async () => {
    if (!enabled || currentFile === 'default' || isAutoSavingRef.current) {
      return;
    }

    try {
      isAutoSavingRef.current = true;
      
      // Get current spreadsheet content
      const currentContent = AppGeneral.getSpreadsheetContent();
      
      // Check if content has changed since last save
      if (currentContent === lastContentRef.current) {
        return;
      }

      // Get existing file data to preserve creation date
      let existingData;
      try {
        existingData = await store._getFile(currentFile);
      } catch (error) {
        // File doesn't exist yet, this might be a new file
        console.warn('File not found for auto-save, skipping:', currentFile);
        return;
      }

      const content = encodeURIComponent(currentContent);
      
      const file = new File(
        existingData.created,
        new Date().toString(),
        content,
        currentFile,
        billType
      );

      await store._saveFile(file);
      lastContentRef.current = currentContent;
      
      if (onSave) {
        onSave(currentFile);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (onError) {
        onError(`Auto-save failed: ${error.message}`);
      }
    } finally {
      isAutoSavingRef.current = false;
    }
  }, [store, currentFile, billType, enabled, onSave, onError]);

  const startAutoSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (enabled && currentFile !== 'default') {
      intervalRef.current = setInterval(performAutoSave, intervalMs);
    }
  }, [performAutoSave, intervalMs, enabled, currentFile]);

  const stopAutoSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const triggerManualSave = useCallback(() => {
    performAutoSave();
  }, [performAutoSave]);

  // Start/restart autosave when dependencies change
  useEffect(() => {
    startAutoSave();
    return stopAutoSave;
  }, [startAutoSave, stopAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoSave();
    };
  }, [stopAutoSave]);

  return {
    triggerManualSave,
    stopAutoSave,
    startAutoSave,
    isAutoSaving: isAutoSavingRef.current
  };
};
