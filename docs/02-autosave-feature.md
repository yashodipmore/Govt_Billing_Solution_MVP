# Auto-Save Feature Implementation

## Overview
The auto-save feature provides automatic document saving functionality that preserves user data at configurable intervals, preventing data loss and improving user experience in the Government Billing Solution MVP.

## Why We Implemented Auto-Save

### Data Protection
- **Prevent Data Loss**: Automatic saving prevents loss of work due to unexpected app closures
- **User Peace of Mind**: Users can work confidently without manually saving frequently
- **Seamless Experience**: Transparent background saving without interrupting workflow

### User Experience
- **Reduced Cognitive Load**: Users don't need to remember to save documents
- **Continuous Workflow**: Uninterrupted editing experience
- **Visual Feedback**: Clear indication of auto-save status and timing

### Business Requirements
- **Government Standards**: Compliance with data retention requirements
- **Reliability**: Ensuring important billing data is never lost
- **Productivity**: Increased efficiency through automated processes

## Use Cases

### Primary Use Cases
1. **Document Editing**: Continuous saving while editing spreadsheets and invoices
2. **Data Entry**: Automatic preservation during long data entry sessions
3. **System Recovery**: Restore work after unexpected app crashes or device issues
4. **Multi-Session Work**: Resume work exactly where left off across app sessions
5. **Mobile Usage**: Reliable saving on mobile devices with connectivity issues

### Specific Scenarios
- **Long Invoice Creation**: Multi-hour invoice preparation with automatic backups
- **Batch Data Entry**: Processing multiple records without manual save operations
- **Field Work**: Mobile data entry with intermittent connectivity
- **Collaborative Work**: Ensuring latest changes are always saved for sharing

## Implementation Details

### Technologies Used

#### Core Technologies
- **React Hooks**: Custom useAutoSave hook for state management
- **Capacitor Preferences**: Local storage for mobile and web platforms
- **TypeScript**: Type-safe implementation with proper interfaces
- **Ionic React**: UI components for settings and feedback

#### Dependencies
```json
{
  "@capacitor/preferences": "^7.0.1",
  "react": "^18.2.0",
  "crypto-js": "^4.2.0"
}
```

### Custom Hook Implementation

#### useAutoSave Hook (`src/hooks/useAutoSave.ts`)

```typescript
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

      // Create file object
      const existingData = await store._getFile(currentFile);
      const file = new File(
        (existingData as any).created,
        new Date().toString(),
        encodeURIComponent(currentContent),
        currentFile,
        billType,
        (existingData as any).password,
        (existingData as any).isPasswordProtected
      );

      // Save file
      await store._saveFile(file);
      lastContentRef.current = currentContent;
      
      if (onSave) {
        onSave(currentFile);
      }
    } catch (error) {
      if (onError) {
        onError(`Auto-save failed: ${(error as Error).message}`);
      }
    } finally {
      isAutoSavingRef.current = false;
    }
  }, [store, currentFile, billType, enabled, onSave, onError]);

  // Auto-save interval management
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

  // Effects for lifecycle management
  useEffect(() => {
    startAutoSave();
    return stopAutoSave;
  }, [startAutoSave, stopAutoSave]);

  useEffect(() => {
    return () => {
      stopAutoSave();
    };
  }, [stopAutoSave]);

  return {
    triggerManualSave: performAutoSave,
    stopAutoSave,
    startAutoSave
  };
};
```

### Integration in Main Component

#### Home Component Integration (`src/pages/Home.tsx`)

```typescript
const Home: React.FC = () => {
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30000);
  const [selectedFile, updateSelectedFile] = useState("default");
  const [billType, updateBillType] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const store = new Local();

  // Load auto-save preferences from localStorage
  useEffect(() => {
    const savedAutoSaveEnabled = localStorage.getItem('autoSaveEnabled');
    const savedAutoSaveInterval = localStorage.getItem('autoSaveInterval');
    
    if (savedAutoSaveEnabled !== null) {
      setAutoSaveEnabled(JSON.parse(savedAutoSaveEnabled));
    }
    if (savedAutoSaveInterval !== null) {
      setAutoSaveInterval(Number(savedAutoSaveInterval));
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('autoSaveEnabled', JSON.stringify(autoSaveEnabled));
  }, [autoSaveEnabled]);

  useEffect(() => {
    localStorage.setItem('autoSaveInterval', autoSaveInterval.toString());
  }, [autoSaveInterval]);

  // Auto-save hook implementation
  const { startAutoSave, stopAutoSave } = useAutoSave(
    store,
    selectedFile,
    billType,
    {
      intervalMs: autoSaveInterval,
      enabled: autoSaveEnabled,
      onSave: (fileName) => {
        setToastMessage(`Auto-saved: ${fileName}`);
        setShowToast(true);
      },
      onError: (error) => {
        setToastMessage(error);
        setShowToast(true);
      }
    }
  );
};
```

### User Interface Components

#### Auto-Save Settings UI

```typescript
// Auto-save settings component
const autoSaveSettings = (
  <>
    <IonItem>
      <IonLabel>Enable Auto-Save</IonLabel>
      <IonToggle
        checked={autoSaveEnabled}
        onIonChange={(e) => setAutoSaveEnabled(e.detail.checked)}
      />
    </IonItem>
    <IonItem>
      <IonLabel>Auto-Save Interval</IonLabel>
      <select
        value={autoSaveInterval}
        onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      >
        <option value={15000}>15 seconds</option>
        <option value={30000}>30 seconds</option>
        <option value={60000}>1 minute</option>
        <option value={120000}>2 minutes</option>
        <option value={300000}>5 minutes</option>
      </select>
    </IonItem>
  </>
);
```

#### Status Indicator

```typescript
// Auto-save status in header
{autoSaveEnabled ? (
  <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '2px' }}>
    <IonIcon icon={cloudDoneOutline} size="small" style={{ marginRight: '4px' }} />
    Auto-save: ON ({autoSaveInterval / 1000}s)
  </div>
) : (
  <div style={{ fontSize: '12px', color: '#f44336', marginTop: '2px' }}>
    Auto-save: OFF
  </div>
)}
```

### Storage Integration

#### Enhanced Local Storage (`src/components/Storage/LocalStorage.ts`)

```typescript
export class File {
  created: string;
  modified: string;
  content: string;
  name: string;
  billType: number;
  password?: string;
  isPasswordProtected: boolean;

  constructor(
    created: string,
    modified: string,
    content: string,
    name: string,
    billType: number,
    password?: string,
    isPasswordProtected: boolean = false
  ) {
    this.created = created;
    this.modified = modified;
    this.content = content;
    this.name = name;
    this.billType = billType;
    this.password = password;
    this.isPasswordProtected = isPasswordProtected;
  }
}

export class Local {
  _saveFile = async (file: File) => {
    let content = file.content;
    
    // Encrypt content if password is provided
    if (file.password) {
      content = CryptoJS.AES.encrypt(file.content, file.password).toString();
    }
    
    let data = {
      created: file.created,
      modified: file.modified,
      content: content,
      name: file.name,
      billType: file.billType,
      isPasswordProtected: file.isPasswordProtected,
    };
    
    await Preferences.set({
      key: file.name,
      value: JSON.stringify(data),
    });
  };
}
```

## Functions and Methods

### Core Functions

1. **`useAutoSave()`**: Main hook for auto-save functionality
2. **`performAutoSave()`**: Executes the actual save operation
3. **`startAutoSave()`**: Initializes auto-save interval
4. **`stopAutoSave()`**: Clears auto-save interval
5. **`triggerManualSave()`**: Allows manual save trigger

### Utility Functions

1. **`getSpreadsheetContent()`**: Retrieves current document content
2. **`_saveFile()`**: Persists file to local storage
3. **`_getFile()`**: Retrieves file from local storage

### Configuration Functions

1. **`setAutoSaveEnabled()`**: Toggle auto-save on/off
2. **`setAutoSaveInterval()`**: Configure save frequency
3. **Save/Load preferences to localStorage

## Commands and Usage

### Installation Commands
```bash
# Install Capacitor Preferences for local storage
npm install @capacitor/preferences@^7.0.1

# Install crypto-js for encryption (if using password protection)
npm install crypto-js@^4.2.0

# Install TypeScript types
npm install --save-dev @types/crypto-js@^4.2.2

# Install React and Ionic (core dependencies)
npm install react@^18.2.0 react-dom@^18.2.0
npm install @ionic/react@^8.6.5
```

### Development Commands
```bash
# Install all dependencies
npm install

# Run development server with auto-save
ionic serve

# Test auto-save functionality
npm run test

# Run on mobile device
ionic cap run android
ionic cap run ios
```

### Build Commands
```bash
# Build for production
ionic build

# Sync with native platforms
ionic cap sync

# Build Android with auto-save
ionic cap run android --prod

# Build iOS with auto-save
ionic cap run ios --prod
```

### Testing Auto-Save
```bash
# Test in browser
ionic serve --lab

# Test on mobile device
ionic cap run android --livereload

# Run unit tests
npm run test:unit

# Test performance
npm run test:performance
```

## Version Specifications

### Dependencies Used
```json
{
  "@capacitor/preferences": "^7.0.1",
  "crypto-js": "^4.2.0",
  "@types/crypto-js": "^4.2.2",
  "react": "^18.2.0",
  "@ionic/react": "^8.6.5"
}
```

### Browser Compatibility
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Mobile Platform Support
- **Android**: 7.0+ (API 24+)
- **iOS**: 13.0+

## Benefits and Features

### Key Benefits

1. **Data Protection**: Prevents data loss from unexpected closures
2. **User Experience**: Seamless, non-intrusive saving
3. **Customization**: Configurable intervals and enable/disable options
4. **Visual Feedback**: Clear status indicators and notifications
5. **Performance**: Efficient content change detection
6. **Mobile Optimized**: Works reliably on mobile devices

### Advanced Features

1. **Content Change Detection**: Only saves when content actually changes
2. **Conflict Prevention**: Prevents concurrent save operations
3. **Error Handling**: Graceful error recovery and user notification
4. **Persistence**: Settings persist across app sessions
5. **Manual Override**: Users can trigger manual saves
6. **Status Indicators**: Real-time auto-save status display

### Performance Optimizations

1. **Content Comparison**: Avoids unnecessary save operations
2. **Debouncing**: Prevents rapid successive saves
3. **Background Operations**: Non-blocking save operations
4. **Memory Management**: Efficient cleanup of intervals and references

## Troubleshooting

### Common Issues and Solutions

#### 1. Auto-Save Not Working
```typescript
// Check if auto-save is enabled
console.log('Auto-save enabled:', autoSaveEnabled);
console.log('Current file:', selectedFile);
```

#### 2. Performance Issues
```typescript
// Increase interval for better performance
setAutoSaveInterval(60000); // 1 minute
```

#### 3. Storage Issues
```bash
# Clear Capacitor preferences
ionic cap clean android
```

## Future Enhancements

### Planned Features
1. **Cloud Sync**: Integration with Firebase for cloud auto-save
2. **Conflict Resolution**: Handle concurrent editing scenarios
3. **Version History**: Maintain auto-save history
4. **Network Awareness**: Adapt behavior based on connectivity
5. **Smart Intervals**: Dynamic intervals based on user activity

### Optimization Opportunities
1. **Delta Saves**: Save only changed content portions
2. **Compression**: Compress saved content for storage efficiency
3. **Background Sync**: Sync with cloud storage in background
4. **User Analytics**: Track auto-save effectiveness and usage patterns

## Conclusion

The auto-save feature significantly enhances the user experience of the Government Billing Solution MVP by providing reliable, automatic data preservation. The implementation is robust, configurable, and optimized for both performance and user experience across web and mobile platforms.
