import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonPage,
  IonPopover,
  IonTitle,
  IonToolbar,
  IonToast,
  IonToggle,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { APP_NAME, DATA } from "../app-data";
import * as AppGeneral from "../components/socialcalc/index.js";
import { useEffect, useState } from "react";
import { Local } from "../components/Storage/LocalStorage";
import { menu, settings, cloudDoneOutline } from "ionicons/icons";
import "./Home.css";
import Menu from "../components/Menu/Menu";
import Files from "../components/Files/Files";
import NewFile from "../components/NewFile/NewFile";
import { useAutoSave } from "../hooks/useAutoSave";

const Home: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPopover, setShowPopover] = useState<{
    open: boolean;
    event: Event | undefined;
  }>({ open: false, event: undefined });
  const [selectedFile, updateSelectedFile] = useState("default");
  const [billType, updateBillType] = useState(1);
  const [device] = useState("default");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [autoSaveInterval, setAutoSaveInterval] = useState(30000); // 30 seconds default

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

  // Save auto-save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('autoSaveEnabled', JSON.stringify(autoSaveEnabled));
  }, [autoSaveEnabled]);

  useEffect(() => {
    localStorage.setItem('autoSaveInterval', autoSaveInterval.toString());
  }, [autoSaveInterval]);

  // Auto-save hook
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

  const closeMenu = () => {
    setShowMenu(false);
  };

  const activateFooter = (footer) => {
    AppGeneral.activateFooterButton(footer);
  };

  useEffect(() => {
    const data = DATA["home"][device]["msc"];
    AppGeneral.initializeApp(JSON.stringify(data));
  }, []);

  useEffect(() => {
    activateFooter(billType);
  }, [billType]);

  const footers = DATA["home"][device]["footers"];
  const footersList = footers.map((footerArray) => {
    return (
      <IonButton
        key={footerArray.index}
        expand="full"
        color="light"
        className="ion-no-margin"
        onClick={() => {
          updateBillType(footerArray.index);
          activateFooter(footerArray.index);
          setShowPopover({ open: false, event: undefined });
        }}
      >
        {footerArray.name}
      </IonButton>
    );
  });

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{APP_NAME}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonToolbar color="primary">
          <IonIcon
            icon={settings}
            slot="end"
            className="ion-padding-end"
            size="large"
            onClick={(e) => {
              setShowPopover({ open: true, event: e.nativeEvent });
              console.log("Popover clicked");
            }}
          />
          <Files
            store={store}
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
            updateBillType={updateBillType}
          />

          <NewFile
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
            store={store}
            billType={billType}
          />
          <IonPopover
            animated
            keyboardClose
            backdropDismiss
            event={showPopover.event}
            isOpen={showPopover.open}
            onDidDismiss={() =>
              setShowPopover({ open: false, event: undefined })
            }
          >
            <div style={{ padding: '10px' }}>
              {footersList}
              
              <hr style={{ margin: '15px 0', border: '1px solid #e0e0e0' }} />
              
              {autoSaveSettings}
            </div>
          </IonPopover>
        </IonToolbar>
        <IonToolbar color="secondary">
          <IonTitle className="ion-text-center">
            Editing : {selectedFile}
            {selectedFile === 'default' ? (
              <div style={{ fontSize: '12px', color: '#ff9800', marginTop: '2px' }}>
                Auto-save disabled for default file
              </div>
            ) : autoSaveEnabled ? (
              <div style={{ fontSize: '12px', color: '#4CAF50', marginTop: '2px' }}>
                <IonIcon icon={cloudDoneOutline} size="small" style={{ marginRight: '4px' }} />
                Auto-save: ON ({autoSaveInterval / 1000}s)
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#f44336', marginTop: '2px' }}>
                Auto-save: OFF
              </div>
            )}
          </IonTitle>
        </IonToolbar>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton type="button" onClick={() => setShowMenu(true)}>
            <IonIcon icon={menu} />
          </IonFabButton>
        </IonFab>

        <Menu
          showM={showMenu}
          setM={closeMenu}
          file={selectedFile}
          updateSelectedFile={updateSelectedFile}
          store={store}
          bT={billType}
        />

        <div id="container">
          <div id="workbookControl"></div>
          <div id="tableeditor"></div>
          <div id="msg"></div>
        </div>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          color={toastMessage.includes('Auto-saved') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
