import { NodeStatus } from '@node-red/registry';
import { Node } from 'node-red';
export declare class Status {
    private node;
    constructor(node: Pick<Node, 'status'>);
    set(status: NodeStatus, timeout?: number): void;
    clear(timeout?: number): void;
}
