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
    RED.nodes.registerType('alice-sh-mode', function (config) {
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        // var
        const name = config.name;
        const device = RED.nodes.getNode(config.device);
        const ctype = 'devices.capabilities.mode';
        const retrievable = true;
        const reportable = config.response; // reportable = response
        const instance = config.instance;
        const modes = config.modes;
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
                setStatus({ fill: 'red', shape: 'dot', text: error }, 5000);
            }
        });
        const _updateInfoDevice = () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield device.updateInfoDevice();
            }
            catch (error) {
                setStatus({ fill: 'red', shape: 'dot', text: error }, 5000);
            }
        });
        if (modes.length < 1) {
            const text = `In the list of supported commands, there must be at least one command`;
            self.error(text);
            setStatus({ fill: 'red', shape: 'dot', text: text }, 5000);
            return;
        }
        // device not init
        if (!device)
            return;
        // init
        let value = device.storage[`${ctype}-${instance}`] || String('auto');
        // init
        try {
            setStatus({});
            let _modes = [];
            modes.forEach((v) => {
                _modes.push({ value: v });
            });
            device.setCapability({
                type: ctype,
                reportable: reportable,
                retrievable: retrievable,
                state: {
                    instance: instance,
                    value: value
                },
                parameters: {
                    instance: instance,
                    modes: _modes
                }
            }, ctype, instance);
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
            device.updateState(payload, ctype, instance);
            yield _updateStateDevice();
        }));
        const onState = (object) => {
            var _a, _b, _c;
            if ((object === null || object === void 0 ? void 0 : object.type) == ctype && ((_a = object === null || object === void 0 ? void 0 : object.state) === null || _a === void 0 ? void 0 : _a.instance) == instance) {
                value = (_b = object === null || object === void 0 ? void 0 : object.state) === null || _b === void 0 ? void 0 : _b.value;
                device.updateState(value, ctype, instance);
                self.send({
                    payload: value,
                    type: object === null || object === void 0 ? void 0 : object.type,
                    instance: (_c = object === null || object === void 0 ? void 0 : object.state) === null || _c === void 0 ? void 0 : _c.instance
                });
                if (reportable) {
                    _updateStateDevice();
                }
            }
        };
        device.on('onState', onState);
        self.on('close', (removed, done) => __awaiter(this, void 0, void 0, function* () {
            device.removeCapability(ctype, instance);
            if (removed) {
                device.storage[`${ctype}-${instance}`] = undefined;
                yield _updateInfoDevice();
                yield _updateStateDevice();
            }
            device.removeListener('onState', onState);
            done();
        }));
    });
};
//# sourceMappingURL=mode.js.map