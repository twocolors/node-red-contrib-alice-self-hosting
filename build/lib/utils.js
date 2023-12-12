"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
const node_process_1 = require("node:process");
exports.Node = {
    webhook: () => {
        let path = '/QYQaXmunrbGW7KWe/webhook';
        if (node_process_1.env.ALICE_SH_PATH !== undefined) {
            path = node_process_1.env.ALICE_SH_PATH;
        }
        path = '/' + path.replace(/^\/|\/$/g, '') + '/';
        return path;
    },
    version: require('../../package.json').version.trim(),
};
//# sourceMappingURL=utils.js.map