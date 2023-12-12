"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("../lib/storage");
const path = __importStar(require("path"));
module.exports = (RED) => {
    const webhook = require('../lib/webhook')(RED);
    let userDir = path.join(require('os').homedir(), '.node-red');
    if (RED.settings.available() && RED.settings.userDir) {
        userDir = RED.settings.userDir;
    }
    storage_1.Storage.init(userDir, 'alice-sh').then(() => {
        RED.nodes.registerType('alice-sh-service', function (config) {
            const self = this;
            self.config = config;
            RED.nodes.createNode(self, config);
            // re-init webhook
            if (config.path) {
                webhook.init(self);
            }
            else {
                self.error(`Not config 'Path Url' for webhook`);
            }
            self.on('close', function () {
                // delete webhook
                const _trim = (path) => path.replace(/^\/|\/$/g, '').split('/')[0];
                for (var i = RED.httpNode._router.stack.length - 1; i >= 0; --i) {
                    let route = RED.httpNode._router.stack[i];
                    if (route.route && _trim(route.route.path) === _trim(config.path)) {
                        // console.log(`${i} - delete - ${route.route.path}`);
                        RED.httpNode._router.stack.splice(i, 1);
                    }
                }
            });
        });
    });
};
//# sourceMappingURL=service.js.map