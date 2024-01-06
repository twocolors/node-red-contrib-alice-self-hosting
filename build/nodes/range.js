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
    RED.nodes.registerType('alice-sh-range', function (config) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        // var
        const device = RED.nodes.getNode(config.device);
        const ctype = 'devices.capabilities.range';
        const instance = config.instance;
        const retrievable = config.retrievable;
        const reportable = config.response; // reportable = response
        const unit = config.unit;
        const min = parseFloat(config.min) || 0;
        const max = parseFloat(config.max) || 100;
        const precision = parseFloat(config.precision) || 1;
        // helpers
        self.statusHelper = new status_1.Status(self);
        // device not init
        if (!device || !device.init)
            return;
        // init
        const keyCache = `${self.id}-${ctype}-${instance}`;
        let value = device.cache.get(keyCache) || Number(min);
        // init
        try {
            self.statusHelper.clear();
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
                    unit: unit,
                    random_access: true,
                    range: {
                        min: min,
                        max: max,
                        precision: precision
                    }
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
            device.updateState(payload, ctype, instance);
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
                device.updateState(value, ctype, instance);
                self.error(`updateStateDevice: ${error}`);
                self.statusHelper.set({
                    fill: 'red',
                    shape: 'dot',
                    text: error
                }, 5000);
            }
        }));
        const onState = (object) => {
            var _a, _b, _c, _d, _e, _f, _g;
            if ((object === null || object === void 0 ? void 0 : object.type) == ctype && ((_a = object === null || object === void 0 ? void 0 : object.state) === null || _a === void 0 ? void 0 : _a.instance) == instance) {
                let _value = (_b = object === null || object === void 0 ? void 0 : object.state) === null || _b === void 0 ? void 0 : _b.value;
                if (retrievable && ((_c = object === null || object === void 0 ? void 0 : object.state) === null || _c === void 0 ? void 0 : _c.relative)) {
                    _value = value + ((_d = object === null || object === void 0 ? void 0 : object.state) === null || _d === void 0 ? void 0 : _d.value);
                    if (((_e = object === null || object === void 0 ? void 0 : object.state) === null || _e === void 0 ? void 0 : _e.value) < 0 && _value < min)
                        _value = min;
                    if (((_f = object === null || object === void 0 ? void 0 : object.state) === null || _f === void 0 ? void 0 : _f.value) > 0 && _value > max)
                        _value = max;
                }
                value = _value;
                device.updateState(value, ctype, instance);
                device.cache.set(keyCache, value);
                self.send({
                    payload: value,
                    type: object === null || object === void 0 ? void 0 : object.type,
                    instance: (_g = object === null || object === void 0 ? void 0 : object.state) === null || _g === void 0 ? void 0 : _g.instance
                });
                self.statusHelper.set({ fill: 'yellow', shape: 'dot', text: value }, 3000);
                if (reportable) {
                    device.updateStateDevice().catch(error => self.error(`updateStateDevice: ${error}`));
                }
            }
        };
        device.on('onState', onState);
        self.on('close', (removed, done) => __awaiter(this, void 0, void 0, function* () {
            device.removeCapability(ctype, instance);
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
            device.removeListener('onState', onState);
            done();
        }));
    });
};
//# sourceMappingURL=range.js.map