import { NodeServiceType } from './types';
export declare const login: (token: string | undefined) => Promise<import("axios").AxiosResponse<any, any>>;
export declare const callback_state: (service: NodeServiceType, device: any) => Promise<import("axios").AxiosResponse<any, any>>;
export declare const callback_discovery: (service: NodeServiceType) => Promise<import("axios").AxiosResponse<any, any>>;
