"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../lib/api");
module.exports = (RED) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const version = require('../../package.json').version.trim();
    RED.nodes.registerType('alice-sh-device', function (config) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        self.setMaxListeners(0);
        // var
        self.service = RED.nodes.getNode(config.service);
        self.cache = self.service.cache;
        // device init
        self.device = {
            id: self.id,
            name: config.name,
            description: config.description,
            room: config.room,
            type: config.dtype,
            device_info: {
                manufacturer: 'Node-RED',
                model: 'virtual device',
                sw_version: version
            },
            capabilities: [],
            properties: []
        };
        // emit to state
        self.onState = function (object) {
            self.emit('onState', object);
        };
        // helper
        // https://github.com/lasthead0/yandex2mqtt/blob/master/device.js#L4
        function convertToYandexValue(val, actType) {
            switch (actType) {
                case 'range':
                case 'float': {
                    if (val == undefined)
                        return Number(0.0);
                    try {
                        const value = parseFloat(val);
                        return isNaN(value) ? Number(0.0) : value;
                    }
                    catch (e) {
                        return Number(0.0);
                    }
                }
                case 'toggle':
                case 'on_off': {
                    if (val == undefined)
                        return false;
                    if (['true', 'on', '1'].indexOf(String(val).toLowerCase()) != -1)
                        return true;
                    else
                        return false;
                }
                default:
                    return val;
            }
        }
        // capabilities
        self.findCapability = function (type, instance) {
            const { capabilities } = self.device;
            if (instance !== undefined) {
                return capabilities.find((p) => { var _a; return p.type === type && ((_a = p.state) === null || _a === void 0 ? void 0 : _a.instance) === instance; });
            }
            else {
                return capabilities.find((p) => p.type === type);
            }
        };
        self.setCapability = function (c, type, instance) {
            const capabilities = self.findCapability(type, instance);
            if (c !== undefined && capabilities === undefined) {
                self.device.capabilities.push(c);
            }
            else {
                throw new Error("Parameters 'capability' is Dublicated on some Device!");
            }
        };
        self.removeCapability = function (type, instance) {
            const index = self.device.capabilities.findIndex((p) => { var _a; return p.type === type && ((_a = p.state) === null || _a === void 0 ? void 0 : _a.instance) === instance; });
            if (index > -1) {
                self.device.capabilities.splice(index, 1);
            }
        };
        // properties
        self.findProperty = function (type, instance) {
            const { properties } = self.device;
            if (instance !== undefined) {
                return properties.find((p) => { var _a; return p.type === type && ((_a = p.state) === null || _a === void 0 ? void 0 : _a.instance) === instance; });
            }
            else {
                return properties.find((p) => p.type === type);
            }
        };
        self.setProperty = function (p, type, instance) {
            const property = self.findProperty(type, instance);
            if (p !== undefined && property === undefined) {
                self.device.properties.push(p);
            }
            else {
                throw new Error("Parameters 'property' is Dublicated on some Device!");
            }
        };
        self.removeProperty = function (type, instance) {
            const index = self.device.properties.findIndex((p) => { var _a; return p.type === type && ((_a = p.state) === null || _a === void 0 ? void 0 : _a.instance) === instance; });
            if (index > -1) {
                self.device.properties.splice(index, 1);
            }
        };
        // !!! update state !!!
        self.updateState = function (val, type, instance) {
            const { capabilities, properties } = self.device;
            try {
                const cp = []
                    .concat(capabilities, properties)
                    .find((cp) => { var _a; return cp.type === type && ((_a = cp.state) === null || _a === void 0 ? void 0 : _a.instance) === instance; });
                if (cp === undefined)
                    return;
                const actType = String(cp.type).split('.')[2];
                const value = convertToYandexValue(val, actType);
                cp.state = { instance, value: value };
            }
            catch (_) {
                /* empty */
            }
        };
        // state device
        self.updateStateDevice = () => api_1.Api.callback_state(self.service, self.device);
        // info device
        self.updateInfoDevice = () => api_1.Api.callback_discovery(self.service);
    });
};
//# sourceMappingURL=device.js.map