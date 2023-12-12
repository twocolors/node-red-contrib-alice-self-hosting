import { Node } from 'node-red';
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
