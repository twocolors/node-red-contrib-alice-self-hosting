import storage from 'node-persist';
import path from 'path';
import {StorageUserType} from './types';

export class Storage {
  static init(storagePath: string, storageName: string): Promise<any> {
    return storage.init({dir: path.resolve(storagePath, storageName)});
  }

  static getUserByToken(token: string): Promise<any> {
    return new Promise(resolve => {
      storage.values().then(values => {
        values.forEach((value: StorageUserType) => {
          if (value.token && value.token === token) {
            resolve(value);
          }
        });
        resolve(null);
      });
    });
  }

  static updateUser(user: StorageUserType): Promise<storage.WriteFileResult> {
    const key = user.login + '-' + user.id;
    return storage.updateItem(key, user);
  }

  static removeUser(user: StorageUserType): Promise<storage.DeleteFileResult> {
    const key = user.login + '-' + user.id;
    return storage.removeItem(key);
  }

  static async getUsersByNodeId(node_id: string): Promise<any> {
    let users: any = [];
    await storage.values().then(values => {
      values.forEach((value: StorageUserType) => {
        if (value.node_id && value.node_id === node_id) {
          users.push(value);
        }
      });
    });
    return Promise.all(users);
  }
}
