"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const status_1 = require("../lib/status");
module.exports = (RED) => {
    RED.nodes.registerType('alice-sh-video', function (config) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        // var
        const device = RED.nodes.getNode(config.device);
        const ctype = 'devices.capabilities.video_stream';
        const instance = 'get_stream';
        const stream_url = config.stream_url;
        const protocol = config.protocol;
        const retrievable = false;
        const reportable = false; // reportable = response
        // helpers
        self.statusHelper = new status_1.Status(self);
        // device not init
        if (!device || !device.init)
            return;
        // init
        try {
            self.statusHelper.clear();
            device.setCapability({
                type: ctype,
                reportable: reportable,
                retrievable: retrievable,
                state: {
                    instance: instance,
                    value: {
                        stream_url: stream_url,
                        protocol: protocol
                    }
                },
                parameters: {
                    instance: instance,
                    protocols: [protocol]
                }
            }, ctype, instance);
        }
        catch (error) {
            self.error(error);
            self.statusHelper.set({
                fill: 'red',
                shape: 'dot',
                text: error
            });
            return;
        }
        device.updateInfoDevice().catch((error) => {
            self.error(`updateInfoDevice: ${error}`);
            self.statusHelper.set({
                fill: 'red',
                shape: 'dot',
                text: error
            }, 5000);
        });
        self.on('close', (removed, done) => __awaiter(this, void 0, void 0, function* () {
            device.removeCapability(ctype, instance);
            if (removed) {
                try {
                    yield device.updateInfoDevice();
                }
                catch (_) {
                    /* empty */
                }
                try {
                    yield device.updateStateDevice();
                }
                catch (_) {
                    /* empty */
                }
            }
            done();
        }));
    });
};
//# sourceMappingURL=video.js.map