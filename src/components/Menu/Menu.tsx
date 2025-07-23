import React, { useState } from "react";
import * as AppGeneral from "../socialcalc/index.js";
import { File, Local } from "../Storage/LocalStorage";
import { isPlatform, IonToast } from "@ionic/react";
import { EmailComposer } from "capacitor-email-composer";
import { Printer } from "@ionic-native/printer";
import { IonActionSheet, IonAlert } from "@ionic/react";
import { saveOutline, save, mail, print, logInOutline, logOutOutline, documentOutline, shareOutline, cloudDownloadOutline, lockClosedOutline, arrowUndoOutline, arrowRedoOutline } from "ionicons/icons";
import { APP_NAME } from "../../app-data.js";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";
import { useHistory } from "react-router-dom";
import { exportAsCsv as exportCsvUtil, exportAsPDF as exportPdfUtil, sharePDF as sharePdfUtil } from "../../utils/exportUtils";

const Menu: React.FC<{
  showM: boolean;
  setM: Function;
  file: string;
  updateSelectedFile: Function;
  store: Local;
  bT: number;
}> = (props) => {
  const [showAlert1, setShowAlert1] = useState(false);
  const [showAlert3, setShowAlert3] = useState(false);
  const [showAlert4, setShowAlert4] = useState(false);
  const [showAlert5, setShowAlert5] = useState(false); // For password-protected save
  const [showToast1, setShowToast1] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { currentUser } = useAuth();
  const history = useHistory();
  /* Utility functions */
  const _validateName = async (filename) => {
    filename = filename.trim();
    if (filename === "default" || filename === "Untitled") {
      setToastMessage("Cannot update default file!");
      return false;
    } else if (filename === "" || !filename) {
      setToastMessage("Filename cannot be empty");
      return false;
    } else if (filename.length > 30) {
      setToastMessage("Filename too long");
      return false;
    } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
      setToastMessage("Special Characters cannot be used");
      return false;
    } else if (await props.store._checkKey(filename)) {
      setToastMessage("Filename already exists");
      return false;
    }
    return true;
  };

  const getCurrentFileName = () => {
    return props.file;
  };

  // Authentication functions
  const handleLogin = () => {
    history.push('/auth');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setToastMessage("Logged out successfully!");
      setShowToast1(true);
    } catch (error: any) {
      setToastMessage("Logout failed: " + error.message);
      setShowToast1(true);
    }
  };

  const _formatString = (filename) => {
    /* Remove whitespaces */
    while (filename.indexOf(" ") !== -1) {
      filename = filename.replace(" ", "");
    }
    return filename;
  };

  const doUndo = () => {
    try {
      AppGeneral.undo();
      setToastMessage("Undo successful");
      setShowToast1(true);
    } catch (error) {
      setToastMessage("Cannot undo");
      setShowToast1(true);
    }
  };

  const doRedo = () => {
    try {
      AppGeneral.redo();
      setToastMessage("Redo successful");
      setShowToast1(true);
    } catch (error) {
      setToastMessage("Cannot redo");
      setShowToast1(true);
    }
  };

  const doPrint = () => {
    if (isPlatform("hybrid")) {
      const printer = Printer;
      printer.print(AppGeneral.getCurrentHTMLContent());
    } else {
      const content = AppGeneral.getCurrentHTMLContent();
      // useReactToPrint({ content: () => content });
      const printWindow = window.open("/printwindow", "Print Invoice");
      printWindow.document.write(content);
      printWindow.print();
    }
  };
  const doSave = async () => {
    if (props.file === "default") {
      setShowAlert1(true);
      return;
    }
    try {
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const data = await props.store._getFile(props.file);
      const file = new File(
        (data as any).created,
        new Date().toString(),
        content,
        props.file,
        props.bT
      );
      await props.store._saveFile(file);
      props.updateSelectedFile(props.file);
      setToastMessage(`File "${props.file}" saved successfully!`);
      setShowToast1(true);
    } catch (error) {
      setToastMessage("Error saving file");
      setShowToast1(true);
    }
  };

  const doSaveAs = async (filename) => {
    // event.preventDefault();
    if (filename) {
      // console.log(filename, _validateName(filename));
      if (await _validateName(filename)) {
        // filename valid . go on save
        const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
        // console.log(content);
        const file = new File(
          new Date().toString(),
          new Date().toString(),
          content,
          filename,
          props.bT
        );
        // const data = { created: file.created, modified: file.modified, content: file.content, password: file.password };
        // console.log(JSON.stringify(data));
        props.store._saveFile(file);
        props.updateSelectedFile(filename);
        setShowAlert4(true);
      } else {
        setShowToast1(true);
      }
    }
  };

  const saveAsPassword = async (alertData) => {
    const { filename, password, confirmPassword } = alertData;
    
    if (!filename || !password || !confirmPassword) {
      setToastMessage("All fields are required");
      setShowToast1(true);
      return;
    }
    
    if (password !== confirmPassword) {
      setToastMessage("Passwords do not match");
      setShowToast1(true);
      return;
    }
    
    if (password.length < 4) {
      setToastMessage("Password must be at least 4 characters long");
      setShowToast1(true);
      return;
    }
    
    if (await _validateName(filename)) {
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const file = new File(
        new Date().toString(),
        new Date().toString(),
        content,
        filename,
        props.bT,
        password
      );
      
      try {
        await props.store._saveFile(file);
        props.updateSelectedFile(filename);
        setToastMessage(`Password-protected file "${filename}" saved successfully`);
        setShowToast1(true);
      } catch (error) {
        setToastMessage("Failed to save password-protected file");
        setShowToast1(true);
      }
    } else {
      setShowToast1(true);
    }
  };

  const sendEmail = () => {
    if (isPlatform("hybrid")) {
      const content = AppGeneral.getCurrentHTMLContent();
      const base64 = btoa(content);

      EmailComposer.open({
        to: ["jackdwell08@gmail.com"],
        cc: [],
        bcc: [],
        body: "PFA",
        attachments: [{ type: "base64", path: base64, name: "Invoice.html" }],
        subject: `${APP_NAME} attached`,
        isHtml: true,
      });
    } else {
      alert("This Functionality works on Anroid/IOS devices");
    }
  };

  // CSV Export Function
  const exportAsCsv = async () => {
    const result = await exportCsvUtil(getCurrentFileName());
    setToastMessage(result.message);
    setShowToast1(true);
  };

  // PDF Export Function
  const exportAsPDF = async (option: string = 'download') => {
    const result = await exportPdfUtil(getCurrentFileName(), option as 'download' | 'share');
    setToastMessage(result.message);
    setShowToast1(true);
  };

  // Share PDF Function
  const share = async () => {
    const result = await sharePdfUtil(getCurrentFileName());
    setToastMessage(result.message);
    setShowToast1(true);
  };

  return (
    <React.Fragment>
      <IonActionSheet
        animated
        keyboardClose
        isOpen={props.showM}
        onDidDismiss={() => props.setM()}
        buttons={[
          {
            text: "Undo",
            icon: arrowUndoOutline,
            handler: () => {
              doUndo();
              console.log("Undo clicked");
            },
          },
          {
            text: "Redo",
            icon: arrowRedoOutline,
            handler: () => {
              doRedo();
              console.log("Redo clicked");
            },
          },
          {
            text: "Save",
            icon: saveOutline,
            handler: () => {
              doSave();
              console.log("Save clicked");
            },
          },
          {
            text: "Save As",
            icon: save,
            handler: () => {
              setShowAlert3(true);
              console.log("Save As clicked");
            },
          },
          {
            text: "Save as Password Protected",
            icon: lockClosedOutline,
            handler: () => {
              setShowAlert5(true);
              console.log("Save as Password Protected clicked");
            },
          },
          {
            text: "Export as CSV",
            icon: cloudDownloadOutline,
            handler: () => {
              exportAsCsv();
              console.log("Export as CSV clicked");
            },
          },
          {
            text: "Export as PDF",
            icon: documentOutline,
            handler: () => {
              exportAsPDF('download');
              console.log("Export as PDF clicked");
            },
          },
          {
            text: "Share PDF",
            icon: shareOutline,
            handler: () => {
              share();
              console.log("Share PDF clicked");
            },
          },
          {
            text: "Print",
            icon: print,
            handler: () => {
              doPrint();
              console.log("Print clicked");
            },
          },
          {
            text: "Email",
            icon: mail,
            handler: () => {
              sendEmail();
              console.log("Email clicked");
            },
          },
          {
            text: currentUser ? "Logout" : "Login/Register",
            icon: currentUser ? logOutOutline : logInOutline,
            handler: () => {
              if (currentUser) {
                handleLogout();
              } else {
                handleLogin();
              }
              console.log(currentUser ? "Logout clicked" : "Login/Register clicked");
            },
          },
        ]}
      />
      <IonAlert
        animated
        isOpen={showAlert1}
        onDidDismiss={() => setShowAlert1(false)}
        header="Alert Message"
        message={
          "Cannot update <strong>" + getCurrentFileName() + "</strong> file!"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert3}
        onDidDismiss={() => setShowAlert3(false)}
        header="Save As"
        inputs={[
          { name: "filename", type: "text", placeholder: "Enter filename" },
        ]}
        buttons={[
          {
            text: "Ok",
            handler: (alertData) => {
              doSaveAs(alertData.filename);
            },
          },
        ]}
      />
      <IonAlert
        animated
        isOpen={showAlert4}
        onDidDismiss={() => setShowAlert4(false)}
        header="Save As"
        message={
          "File <strong>" +
          getCurrentFileName() +
          "</strong> saved successfully"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert5}
        onDidDismiss={() => setShowAlert5(false)}
        header="Save as Password Protected"
        inputs={[
          { name: "filename", type: "text", placeholder: "Enter filename" },
          { name: "password", type: "password", placeholder: "Enter password" },
          { name: "confirmPassword", type: "password", placeholder: "Confirm password" },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
          },
          {
            text: "Save",
            handler: (alertData) => {
              saveAsPassword(alertData);
            },
          },
        ]}
      />
      <IonToast
        animated
        isOpen={showToast1}
        onDidDismiss={() => {
          setShowToast1(false);
          setShowAlert3(true);
        }}
        position="bottom"
        message={toastMessage}
        duration={500}
      />
    </React.Fragment>
  );
};

export default Menu;
