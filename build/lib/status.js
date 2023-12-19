"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = void 0;
const util_1 = require("util");
class Status {
    constructor(node) {
        this.node = node;
    }
    set(status, timeout = 0) {
        let text = status.text && typeof status.text !== 'object' ? String(status.text) : (0, util_1.inspect)(status.text);
        if (text && text.length > 32) {
            text = `${text.substring(0, 32)}...`;
        }
        status.text = text;
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