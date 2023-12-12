import storage from 'node-persist';
import { StorageUserType } from './types';
export declare class Storage {
    static init(storagePath: string, storageName: string): Promise<any>;
    static getUserByToken(token: string): Promise<any>;
    static updateUser(user: StorageUserType): Promise<storage.WriteFileResult>;
    static removeUser(user: StorageUserType): Promise<storage.DeleteFileResult>;
    static getUsersByNodeId(node_id: string): Promise<any>;
}
