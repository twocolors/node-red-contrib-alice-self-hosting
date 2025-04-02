import {Node} from 'node-red';
import {LRUCache} from 'lru-cache';
import {Express} from 'express';
import {Server} from 'node:http';

export type NodeServiceType = Node & {
  cache: LRUCache<string, any>;
  app: Express;
  config: {
    debug: boolean;
    port: number;
  };
  init: boolean;
  server: Server;
};

export type NodeDeviceType = Node & {
  config: any;
  cache: LRUCache<string, any>;
  device: any;
  onState: (c: any) => void;
  findCapability: (type: string, instance: any) => any;
  setCapability: (c: any, type: string, instance: any) => void;
  removeCapability: (type: string, instance: any) => void;
  findProperty: (type: string, instance: any) => any;
  setProperty: (c: any, type: string, instance: any) => void;
  removeProperty: (type: string, instance: any) => void;
  updateState: (val: any, type: string, instance: any) => void;
  updateStateDevice: () => Promise<void>;
  updateInfoDevice: () => Promise<void>;
  on(event: 'onState', object: any): void;
  init: boolean;
  service: NodeServiceType;
};
