import {NodeStatus} from '@node-red/registry';
import {Node} from 'node-red';

export class Status {
  constructor(private node: Pick<Node, 'status'>) {}

  set(status: NodeStatus, timeout: number = 0): void {
    this.node.status(status);
    if (timeout) {
      this.clear(timeout);
    }
  }

  clear(timeout: number = 0): void {
    setTimeout(() => {
      this.node.status({});
    }, timeout);
  }
}
