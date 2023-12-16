import { Node } from 'node-red';
import NanoCache from 'nano-cache';
export type StorageUserType = {
    id: number;
    login: string;
    client_id: string;
    psuid: string;
    token: string;
    node_id: string;
};
export type NodeConfigType = Node & {
    config?: any;
    device?: any;
    onState: (c: any) => void;
};
export type NodeServiceType = Node & {
    cache: NanoCache;
};
export type NodeDeviceType = Node & {
    config: any;
    device: any;
    onState: (c: any) => void;
};
