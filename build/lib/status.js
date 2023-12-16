"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = void 0;
class Status {
    constructor(node) {
        this.node = node;
    }
    set(status, timeout = 0) {
        this.node.status(status);
        if (timeout) {
            this.clear(timeout);
        }
    }
    clear(timeout = 0) {
        setTimeout(() => {
            this.node.status({});
        }, timeout);
    }
}
exports.Status = Status;
//# sourceMappingURL=status.js.map