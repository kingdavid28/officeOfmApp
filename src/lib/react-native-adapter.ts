// React Native Platform Adapter
import { Platform } from 'react-native';

export interface PlatformAdapter {
  isWeb: boolean;
  isMobile: boolean;
  storage: StorageAdapter;
  filesystem: FilesystemAdapter;
  notifications: NotificationAdapter;
}

export interface StorageAdapter {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

export interface FilesystemAdapter {
  writeFile(path: string, data: string): Promise<void>;
  readFile(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
}

export interface NotificationAdapter {
  requestPermission(): Promise<boolean>;
  scheduleNotification(title: string, body: string, data?: any): Promise<void>;
  onNotificationReceived(callback: (notification: any) => void): void;
}

class WebAdapter implements PlatformAdapter {
  isWeb = true;
  isMobile = false;

  storage: StorageAdapter = {
    async setItem(key: string, value: string) {
      localStorage.setItem(key, value);
    },
    async getItem(key: string) {
      return localStorage.getItem(key);
    },
    async removeItem(key: string) {
      localStorage.removeItem(key);
    }
  };

  filesystem: FilesystemAdapter = {
    async writeFile(path: string, data: string) {
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'file';
      a.click();
    },
    async readFile(path: string) {
      const response = await fetch(path);
      return response.text();
    },
    async exists(path: string) {
      try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    },
    async mkdir(path: string) {
      // No-op for web
    }
  };

  notifications: NotificationAdapter = {
    async requestPermission() {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    },
    async scheduleNotification(title: string, body: string, data?: any) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, data });
      }
    },
    onNotificationReceived(callback: (notification: any) => void) {
      // Web notifications are handled differently
    }
  };
}

class ReactNativeAdapter implements PlatformAdapter {
  isWeb = false;
  isMobile = true;

  storage: StorageAdapter = {
    async setItem(key: string, value: string) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    },
    async getItem(key: string) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return AsyncStorage.getItem(key);
    },
    async removeItem(key: string) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(key);
    }
  };

  filesystem: FilesystemAdapter = {
    async writeFile(path: string, data: string) {
      const RNFS = require('react-native-fs');
      await RNFS.writeFile(path, data, 'utf8');
    },
    async readFile(path: string) {
      const RNFS = require('react-native-fs');
      return RNFS.readFile(path, 'utf8');
    },
    async exists(path: string) {
      const RNFS = require('react-native-fs');
      return RNFS.exists(path);
    },
    async mkdir(path: string) {
      const RNFS = require('react-native-fs');
      await RNFS.mkdir(path);
    }
  };

  notifications: NotificationAdapter = {
    async requestPermission() {
      const PushNotification = require('react-native-push-notification').default;
      return new Promise((resolve) => {
        PushNotification.requestPermissions().then(resolve);
      });
    },
    async scheduleNotification(title: string, body: string, data?: any) {
      const PushNotification = require('react-native-push-notification').default;
      PushNotification.localNotification({
        title,
        message: body,
        userInfo: data
      });
    },
    onNotificationReceived(callback: (notification: any) => void) {
      const PushNotification = require('react-native-push-notification').default;
      PushNotification.configure({
        onNotification: callback
      });
    }
  };
}

export const platformAdapter: PlatformAdapter = 
  typeof window !== 'undefined' ? new WebAdapter() : new ReactNativeAdapter();