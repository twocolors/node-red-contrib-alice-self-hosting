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
const storage_1 = require("./storage");
const api_1 = require("./api");
module.exports = (RED) => {
    const _pong = (req, res) => {
        console.log(req.route.path);
        res.sendStatus(200);
        return;
    };
    const _unlink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        console.log(req.route.path);
        // TODO: write middleware for validate ...
        const [request_id, token] = [req.get('X-Request-Id'), (_a = req.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1]];
        if (request_id === undefined || token === undefined) {
            res.sendStatus(401);
            return;
        }
        const user = yield storage_1.Storage.getUserByToken(token);
        if (user) {
            // TODO: bad hack
            try {
                yield storage_1.Storage.removeUser(user);
            }
            catch (_) { }
            res.sendStatus(200);
            return;
        }
        res.sendStatus(404);
        return;
    });
    const devices = (user) => {
        const devices = [];
        RED.nodes.eachNode(node => {
            var _a, _b, _c, _d, _e, _f;
            const device = RED.nodes.getNode(node.id);
            if (device && ((_a = device.config) === null || _a === void 0 ? void 0 : _a.service) && ((_b = device.config) === null || _b === void 0 ? void 0 : _b.service) === user.node_id) {
                if (!((_c = device.config) === null || _c === void 0 ? void 0 : _c.access) ||
                    ((_d = device.config) === null || _d === void 0 ? void 0 : _d.access) === undefined ||
                    ((_f = (_e = device.config) === null || _e === void 0 ? void 0 : _e.access) === null || _f === void 0 ? void 0 : _f.split(',').includes(String(user.login)))) {
                    devices.push(device.device);
                }
            }
        });
        return devices;
    };
    const _devices = (node, req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        console.log(req.route.path);
        // TODO: write middleware for validate ...
        const [request_id, token] = [req.get('X-Request-Id'), (_b = req.get('Authorization')) === null || _b === void 0 ? void 0 : _b.split(' ')[1]];
        if (request_id === undefined || token === undefined) {
            res.sendStatus(401);
            return;
        }
        // TODO: write middleware for auth ...
        let user = (yield storage_1.Storage.getUserByToken(token));
        if (!user) {
            try {
                user = yield api_1.Api.login(token);
            }
            catch (error) {
                RED.log.error(`fail authorization user (${error})`);
                res.sendStatus(401);
                return;
            }
        }
        // TODO: MB change node.id (or empty) update User
        if (user.node_id === undefined || user.node_id != node.id) {
            yield storage_1.Storage.updateUser(Object.assign(Object.assign({}, user), { token, node_id: node.id }));
        }
        let json = {
            request_id: request_id,
            payload: {
                user_id: `${user.login}-${user.id}`,
                devices: devices(user)
            }
        };
        res.status(200).json(json);
        return;
    });
    const query = (user, id) => {
        const devices = [];
        id.forEach((e) => {
            var _a, _b, _c, _d, _e, _f;
            const device = RED.nodes.getNode(e.id);
            if (device && ((_a = device.config) === null || _a === void 0 ? void 0 : _a.service) && ((_b = device.config) === null || _b === void 0 ? void 0 : _b.service) === user.node_id) {
                if (!((_c = device.config) === null || _c === void 0 ? void 0 : _c.access) ||
                    ((_d = device.config) === null || _d === void 0 ? void 0 : _d.access) === undefined ||
                    ((_f = (_e = device.config) === null || _e === void 0 ? void 0 : _e.access) === null || _f === void 0 ? void 0 : _f.split(',').includes(String(user.login)))) {
                    devices.push(device.device);
                }
                else {
                    devices.push({
                        id: e.id,
                        error_code: 'DEVICE_NOT_FOUND',
                        error_message: `device(${e.id}) not found or not access for user(${user.login})`
                    });
                }
            }
        });
        return devices;
    };
    const _query = (node, req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _c, _d, _e, _f;
        console.log(req.route.path);
        // TODO: write middleware for validate ...
        const [request_id, token] = [req.get('X-Request-Id'), (_c = req.get('Authorization')) === null || _c === void 0 ? void 0 : _c.split(' ')[1]];
        if (request_id === undefined || token === undefined) {
            res.sendStatus(401);
            return;
        }
        // TODO: write middleware for auth ...
        let user = (yield storage_1.Storage.getUserByToken(token));
        if (!user) {
            try {
                user = yield api_1.Api.login(token);
            }
            catch (error) {
                RED.log.error(`fail authorization user (${error})`);
                res.sendStatus(401);
                return;
            }
        }
        // TODO: MB change node.id (or empty) update User
        if (user.node_id === undefined || user.node_id != node.id) {
            yield storage_1.Storage.updateUser(Object.assign(Object.assign({}, user), { token, node_id: node.id }));
        }
        if (((_d = req.body) === null || _d === void 0 ? void 0 : _d.devices) === undefined || ((_f = (_e = req.body) === null || _e === void 0 ? void 0 : _e.devices) === null || _f === void 0 ? void 0 : _f.length) === 0) {
            res.sendStatus(404);
            return;
        }
        let json = {
            request_id: request_id,
            payload: {
                user_id: `${user.login}-${user.id}`,
                devices: query(user, req.body.devices)
            }
        };
        res.status(200).json(json);
        return;
    });
    const action = (user, id) => {
        const devices = [];
        id.forEach((e) => {
            var _a, _b, _c, _d, _e, _f;
            const device = RED.nodes.getNode(e.id);
            if (device && ((_a = device.config) === null || _a === void 0 ? void 0 : _a.service) && ((_b = device.config) === null || _b === void 0 ? void 0 : _b.service) === user.node_id) {
                if (!((_c = device.config) === null || _c === void 0 ? void 0 : _c.access) ||
                    ((_d = device.config) === null || _d === void 0 ? void 0 : _d.access) === undefined ||
                    ((_f = (_e = device.config) === null || _e === void 0 ? void 0 : _e.access) === null || _f === void 0 ? void 0 : _f.split(',').includes(String(user.login)))) {
                    const capabilities = [];
                    e.capabilities.forEach((c) => {
                        device.onState(c);
                        capabilities.push({
                            type: c.type,
                            state: {
                                instance: c.state.instance,
                                action_result: {
                                    status: 'DONE'
                                }
                            }
                        });
                    });
                    devices.push({
                        id: e.id,
                        capabilities: capabilities
                    });
                }
                else {
                    devices.push({
                        id: e.id,
                        action_result: {
                            status: 'ERROR',
                            error_code: 'DEVICE_NOT_FOUND',
                            error_message: `device(${e.id}) not found or not access for user(${user.login})`
                        }
                    });
                }
            }
        });
        return devices;
    };
    const _action = (node, req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _g, _h, _j, _k, _l, _m;
        console.log(req.route.path);
        // TODO: write middleware for validate ...
        const [request_id, token] = [req.get('X-Request-Id'), (_g = req.get('Authorization')) === null || _g === void 0 ? void 0 : _g.split(' ')[1]];
        if (request_id === undefined || token === undefined) {
            res.sendStatus(401);
            return;
        }
        // TODO: write middleware for auth ...
        let user = (yield storage_1.Storage.getUserByToken(token));
        if (!user) {
            try {
                user = yield api_1.Api.login(token);
            }
            catch (error) {
                RED.log.error(`fail authorization user (${error})`);
                res.sendStatus(401);
                return;
            }
        }
        // TODO: MB change node.id (or empty) update User
        if (user.node_id === undefined || user.node_id != node.id) {
            yield storage_1.Storage.updateUser(Object.assign(Object.assign({}, user), { token, node_id: node.id }));
        }
        if (((_j = (_h = req.body) === null || _h === void 0 ? void 0 : _h.payload) === null || _j === void 0 ? void 0 : _j.devices) === undefined || ((_m = (_l = (_k = req.body) === null || _k === void 0 ? void 0 : _k.payload) === null || _l === void 0 ? void 0 : _l.devices) === null || _m === void 0 ? void 0 : _m.length) === 0) {
            res.sendStatus(404);
            return;
        }
        let json = {
            request_id: request_id,
            payload: {
                user_id: `${user.login}-${user.id}`,
                devices: action(user, req.body.payload.devices)
            }
        };
        res.status(200).json(json);
        return;
    });
    const init = (node) => {
        const _path = `/${node.config.path.replace(/^\/|\/$/g, '')}/webhook`;
        // HEAD /v1.0/                    Проверка доступности Endpoint URL провайдера
        RED.httpNode.head(`${_path}/v1.0/`, (req, res) => _pong(req, res));
        // POST /v1.0/user/unlink         Оповещение о разъединении аккаунтов
        RED.httpNode.post(`${_path}/v1.0/user/unlink`, (req, res) => __awaiter(void 0, void 0, void 0, function* () { return yield _unlink(req, res); }));
        // GET  /v1.0/user/devices        Информация об устройствах пользователя
        RED.httpNode.get(`${_path}/v1.0/user/devices`, (req, res) => __awaiter(void 0, void 0, void 0, function* () { return yield _devices(node, req, res); }));
        // POST /v1.0/user/devices/query  Информация о состояниях устройств пользователя
        RED.httpNode.post(`${_path}/v1.0/user/devices/query`, (req, res) => __awaiter(void 0, void 0, void 0, function* () { return yield _query(node, req, res); }));
        // POST /v1.0/user/devices/action	Изменение состояния у устройств
        RED.httpNode.post(`${_path}/v1.0/user/devices/action`, (req, res) => __awaiter(void 0, void 0, void 0, function* () { return yield _action(node, req, res); }));
    };
    return {
        init
    };
};
//# sourceMappingURL=webhook.js.map