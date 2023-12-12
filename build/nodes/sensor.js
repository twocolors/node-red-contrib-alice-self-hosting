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
const util_1 = require("util");
module.exports = (RED) => {
    RED.nodes.registerType('alice-sh-sensor', function (config) {
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        // var
        const name = config.name;
        const device = RED.nodes.getNode(config.device);
        const ptype = config.ptype;
        const instance = config.instance;
        const unit = config.unit;
        const retrievable = true;
        const reportable = true;
        // helpers
        const clearStatus = (timeout = 0) => {
            setTimeout(() => {
                self.status({});
            }, timeout);
        };
        const setStatus = (status, timeout = 0) => {
            self.status(status);
            if (timeout) {
                clearStatus(timeout);
            }
        };
        const _updateStateDevice = () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield device.updateStateDevice();
            }
            catch (error) {
                self.error(error);
                setStatus({ fill: 'red', shape: 'dot', text: error }, 5000);
            }
        });
        const _updateInfoDevice = () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield device.updateInfoDevice();
            }
            catch (error) {
                self.error(error);
                setStatus({ fill: 'red', shape: 'dot', text: error }, 5000);
            }
        });
        // device not init
        if (!device)
            return;
        // init
        let value = device.storage[`${ptype}-${instance}`] || Number(0.0);
        // init
        try {
            setStatus({});
            device.setProperty({
                type: ptype,
                reportable: reportable,
                retrievable: retrievable,
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
            setStatus({
                fill: 'red',
                shape: 'dot',
                text: error
            });
            return;
        }
        _updateInfoDevice();
        self.on('input', (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            const payload = msg.payload;
            if (value == payload)
                return;
            value = payload;
            let text = typeof payload !== 'undefined' && typeof payload !== 'object' ? payload : (0, util_1.inspect)(payload);
            if (text && text.length > 32) {
                text = text.substr(0, 32) + '...';
            }
            setStatus({ fill: 'yellow', shape: 'dot', text: text }, 3000);
            device.updateState(payload, ptype, instance);
            yield _updateStateDevice();
        }));
        self.on('close', (removed, done) => __awaiter(this, void 0, void 0, function* () {
            device.removeProperty(ptype, instance);
            if (removed) {
                device.storage[`${ptype}-${instance}`] = undefined;
                yield _updateInfoDevice();
                yield _updateStateDevice();
            }
            done();
        }));
    });
};
//# sourceMappingURL=sensor.js.map