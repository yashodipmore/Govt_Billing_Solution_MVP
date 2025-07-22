import React, { useState, useEffect } from "react";
import "./Files.css";
import * as AppGeneral from "../socialcalc/index.js";
import { DATA } from "../../app-data.js";
import { Local } from "../Storage/LocalStorage";
import {
  IonIcon,
  IonModal,
  IonItem,
  IonButton,
  IonList,
  IonLabel,
  IonAlert,
  IonItemGroup,
  IonSearchbar,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/react";
import { fileTrayFull, trash, create } from "ionicons/icons";

const Files: React.FC<{
  store: Local;
  file: string;
  updateSelectedFile: Function;
  updateBillType: Function;
}> = (props) => {
  const [modal, setModal] = useState(null);
  const [listFiles, setListFiles] = useState(false);
  const [showAlert1, setShowAlert1] = useState(false);
  const [currentKey, setCurrentKey] = useState(null);
  const [searchText, setSearchText] = useState("");

  const editFile = (key) => {
    props.store._getFile(key).then((data) => {
      AppGeneral.viewFile(key, decodeURIComponent((data as any).content));
      props.updateSelectedFile(key);
      props.updateBillType((data as any).billType);
    });
  };

  const deleteFile = (key) => {
    setShowAlert1(true);
    setCurrentKey(key);
  };

  const loadDefault = () => {
    const msc = DATA["home"][AppGeneral.getDeviceType()]["msc"];
    AppGeneral.viewFile("default", JSON.stringify(msc));
    props.updateSelectedFile("default");
  };

  const _formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const temp = async () => {
    const files = await props.store._getAllFiles();
    
    // Filter files based on search text
    const filteredFileKeys = Object.keys(files).filter((key) =>
      key.toLowerCase().includes(searchText.toLowerCase())
    );
    
    const fileList = filteredFileKeys.length > 0 ? filteredFileKeys.map((key) => {
      return (
        <IonItemGroup key={key}>
          <IonItem className="file-item">
            <IonLabel>{key}</IonLabel>
            {_formatDate(files[key])}

            <IonIcon
              icon={create}
              color="warning"
              slot="end"
              size="large"
              onClick={() => {
                setListFiles(false);
                setSearchText(""); // Clear search when editing
                editFile(key);
              }}
            />

            <IonIcon
              icon={trash}
              color="danger"
              slot="end"
              size="large"
              onClick={() => {
                setListFiles(false);
                setSearchText(""); // Clear search when deleting
                deleteFile(key);
              }}
            />
          </IonItem>
        </IonItemGroup>
      );
    }) : [
      <IonItem key="no-results" className="no-results-item">
        <IonLabel>
          {searchText ? "No files found matching your search." : "No files available."}
        </IonLabel>
      </IonItem>
    ];

    const ourModal = (
      <IonModal 
        isOpen={listFiles} 
        onDidDismiss={() => {
          setListFiles(false);
          setSearchText(""); // Clear search when modal is closed
        }}
        className="file-manager-modal"
      >
        <IonHeader className="file-manager-header">
          <IonToolbar>
            <IonTitle>File Manager</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="file-manager-content">
          <IonSearchbar
            value={searchText}
            debounce={300}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search files..."
            showClearButton="focus"
            className="file-manager-searchbar"
          />
          <IonList>{fileList}</IonList>
          <IonButton
            expand="block"
            color="secondary"
            onClick={() => {
              setListFiles(false);
              setSearchText(""); // Clear search when back button is clicked
            }}
          >
            Back
          </IonButton>
        </IonContent>
      </IonModal>
    );
    setModal(ourModal);
  };

  useEffect(() => {
    temp();
  }, [listFiles, searchText]); // Added searchText dependency for real-time filtering

  return (
    <React.Fragment>
      <IonIcon
        icon={fileTrayFull}
        className="ion-padding-end"
        slot="end"
        size="large"
        onClick={() => {
          setListFiles(true);
        }}
      />
      {modal}
      <IonAlert
        animated
        isOpen={showAlert1}
        onDidDismiss={() => setShowAlert1(false)}
        header="Delete file"
        message={"Do you want to delete the " + currentKey + " file?"}
        buttons={[
          { text: "No", role: "cancel" },
          {
            text: "Yes",
            handler: () => {
              props.store._deleteFile(currentKey);
              loadDefault();
              setCurrentKey(null);
            },
          },
        ]}
      />
    </React.Fragment>
  );
};

export default Files;
