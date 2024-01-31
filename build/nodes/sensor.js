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
    RED.nodes.registerType('alice-sh-sensor', function (config) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        // var
        const device = RED.nodes.getNode(config.device);
        const ptype = config.ptype;
        const instance = config.instance;
        const unit = config.unit;
        const retrievable = true;
        const reportable = true;
        // helpers
        self.statusHelper = new status_1.Status(self);
        // device not init
        if (!device || !device.init)
            return;
        // init
        const keyCache = `${self.id}-${ptype}-${instance}`;
        let value = device.cache.get(keyCache) || Number(0.0);
        // init
        try {
            self.statusHelper.clear();
            device.setProperty({
                type: ptype,
                retrievable: retrievable,
                reportable: reportable,
                parameters: {
                    instance: instance,
                    unit: unit
                },
                state: {
                    instance: instance,
                    value: value
                }
            }, ptype, instance);
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
        self.on('input', (msg) => __awaiter(this, void 0, void 0, function* () {
            if (typeof msg.payload !== 'number') {
                self.statusHelper.set({
                    fill: 'red',
                    shape: 'dot',
                    text: 'Wrong type! msg.payload must be number'
                }, 3000);
                return;
            }
            const payload = Number(msg.payload.toFixed(2));
            if (value == payload)
                return;
            self.statusHelper.set({ fill: 'yellow', shape: 'dot', text: payload }, 3000);
            device.updateState(payload, ptype, instance);
            try {
                yield device.updateStateDevice();
                value = payload;
                device.cache.set(keyCache, value);
                setTimeout(() => self.statusHelper.set({
                    fill: 'blue',
                    shape: 'ring',
                    text: 'Ok'
                }, 3000), 3000);
            }
            catch (error) {
                device.updateState(value, ptype, instance);
                self.error(`updateStateDevice: ${error}`);
                self.statusHelper.set({
                    fill: 'red',
                    shape: 'dot',
                    text: error
                }, 5000);
            }
        }));
        self.on('close', (removed, done) => __awaiter(this, void 0, void 0, function* () {
            device.removeProperty(ptype, instance);
            if (removed) {
                device.cache.del(keyCache);
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
//# sourceMappingURL=sensor.js.map