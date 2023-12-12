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
const storage_1 = require("../lib/storage");
const api_1 = require("../lib/api");
const util_1 = require("util");
module.exports = (RED) => {
    RED.nodes.registerType('alice-sh-device', function (config) {
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        self.setMaxListeners(0);
        // var
        const name = config.name;
        const service = RED.nodes.getNode(config.service);
        const description = config.description;
        const room = config.room;
        const dtype = config.dtype;
        const access = config.access;
        // bad hack for storage
        self.storage = {};
        // device
        self.device = {
            id: self.id,
            name: name,
            description: description,
            room: room,
            type: dtype,
            device_info: {
                manufacturer: 'Node-RED',
                model: 'virtual device',
                sw_version: 'test v1'
            },
            capabilities: [],
            properties: []
        };
        self.onState = function (object) {
            self.emit('onState', object);
        };
        // help
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
                throw new Error(`Parameters 'capability' is Dublicated on some Device!`);
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
                throw new Error(`Parameters 'property' is Dublicated on some Device!`);
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
                // save to storage
                self.storage[`${type}-${instance}`] = value;
            }
            catch (_) { }
        };
        // state device
        self.updateStateDevice = function () {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function* () {
                const node_id = service.id;
                const skill_id = (_a = service.config) === null || _a === void 0 ? void 0 : _a.skill_id;
                const oauth_token = (_b = service.config) === null || _b === void 0 ? void 0 : _b.oauth_token;
                const device = self.device;
                if (!skill_id) {
                    throw new Error(`Parameters 'skill_id' is not set in parents`);
                }
                if (!oauth_token) {
                    throw new Error(`Parameters 'oauth_token' is not set in parents`);
                }
                const users = yield storage_1.Storage.getUsersByNodeId(node_id);
                if ((users === null || users === void 0 ? void 0 : users.length) === 0) {
                    return;
                }
                yield users.forEach((u) => __awaiter(this, void 0, void 0, function* () {
                    var _c, _d;
                    if (!access || access === undefined || access.split(',').includes(String(u.login))) {
                        try {
                            yield api_1.Api.callback_state(skill_id, oauth_token, u, device);
                        }
                        catch (error) {
                            const _error = error;
                            const status = (_c = _error.response) === null || _c === void 0 ? void 0 : _c.status;
                            let text = (_d = _error.response) === null || _d === void 0 ? void 0 : _d.data;
                            if (typeof text === 'object') {
                                text = (0, util_1.inspect)(text);
                            }
                            if (typeof text === 'string') {
                                text = text.replace(/^\n+|\n+$/g, '');
                            }
                            self.error(`updateStateDevice(${u.login}): ${status} - ${text}`);
                        }
                    }
                }));
            });
        };
        // info device
        self.updateInfoDevice = function () {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function* () {
                const node_id = service.id;
                const skill_id = (_a = service.config) === null || _a === void 0 ? void 0 : _a.skill_id;
                const oauth_token = (_b = service.config) === null || _b === void 0 ? void 0 : _b.oauth_token;
                if (!skill_id) {
                    throw new Error(`Parameters 'skill_id' is not set in parents`);
                }
                if (!oauth_token) {
                    throw new Error(`Parameters 'oauth_token' is not set in parents`);
                }
                const users = yield storage_1.Storage.getUsersByNodeId(node_id);
                if ((users === null || users === void 0 ? void 0 : users.length) === 0) {
                    return;
                }
                yield users.forEach((u) => __awaiter(this, void 0, void 0, function* () {
                    var _c, _d;
                    if (!access || access === undefined || access.split(',').includes(String(u.login))) {
                        try {
                            yield api_1.Api.callback_discovery(skill_id, oauth_token, u);
                        }
                        catch (error) {
                            const _error = error;
                            const status = (_c = _error.response) === null || _c === void 0 ? void 0 : _c.status;
                            let text = (_d = _error.response) === null || _d === void 0 ? void 0 : _d.data;
                            if (typeof text === 'object') {
                                text = (0, util_1.inspect)(text);
                            }
                            if (typeof text === 'string') {
                                text = text.replace(/^\n+|\n+$/g, '');
                            }
                            self.error(`updateInfoDevice(${u.login}): ${status} - ${text}`);
                        }
                    }
                }));
            });
        };
    });
};
//# sourceMappingURL=device.js.map