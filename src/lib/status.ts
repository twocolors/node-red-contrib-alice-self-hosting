import {NodeStatus} from '@node-red/registry';
import {Node} from 'node-red';
import {inspect} from 'util';

export class Status {
  constructor(private node: Pick<Node, 'status'>) {}

  set(status: NodeStatus, timeout: number = 0): void {
    let text: string = status.text && typeof status.text !== 'object' ? String(status.text) : inspect(status.text);
    if (text && text.length > 32) {
      text = `${text.substring(0, 32)}...`;
    }
    status.text = text;
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
