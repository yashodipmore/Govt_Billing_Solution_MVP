import { Preferences } from "@capacitor/preferences";
import CryptoJS from "crypto-js";

export class File {
  created: string;
  modified: string;
  name: string;
  content: string;
  billType: number;
  password?: string;
  isPasswordProtected: boolean;

  constructor(
    created: string,
    modified: string,
    content: string,
    name: string,
    billType: number,
    password?: string
  ) {
    this.created = created;
    this.modified = modified;
    this.content = content;
    this.name = name;
    this.billType = billType;
    this.password = password;
    this.isPasswordProtected = !!password;
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

  _getFile = async (name: string, password?: string) => {
    const rawData = await Preferences.get({ key: name });
    const data = JSON.parse(rawData.value);
    
    // Decrypt content if password protected
    if (data.isPasswordProtected && password) {
      try {
        const bytes = CryptoJS.AES.decrypt(data.content, password);
        data.content = bytes.toString(CryptoJS.enc.Utf8);
        if (!data.content) {
          throw new Error("Invalid password");
        }
      } catch (error) {
        throw new Error("Invalid password or corrupted file");
      }
    }
    
    return data;
  };

  _getAllFiles = async () => {
    let arr = {};
    const { keys } = await Preferences.keys();
    for (let i = 0; i < keys.length; i++) {
      let fname = keys[i];
      try {
        const data = await this._getFileMetadata(fname);
        arr[fname] = {
          modified: (data as any).modified,
          isPasswordProtected: (data as any).isPasswordProtected || false
        };
      } catch (error) {
        // Skip corrupted files
        console.warn(`Skipping corrupted file: ${fname}`);
      }
    }
    return arr;
  };

  _getFileMetadata = async (name: string) => {
    const rawData = await Preferences.get({ key: name });
    return JSON.parse(rawData.value);
  };

  _deleteFile = async (name: string) => {
    await Preferences.remove({ key: name });
  };

  _checkKey = async (key: string) => {
    const { keys } = await Preferences.keys();
    if (keys.includes(key, 0)) {
      return true;
    } else {
      return false;
    }
  };

  _verifyPassword = async (name: string, password: string): Promise<boolean> => {
    try {
      await this._getFile(name, password);
      return true;
    } catch (error) {
      return false;
    }
  };
}
