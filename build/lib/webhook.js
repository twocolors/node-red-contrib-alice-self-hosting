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
const api_1 = require("./api");
module.exports = (RED) => {
    // helper
    const buildPath = function (path) {
        return `/${path.replace(/^\/|\/$/g, '')}/webhook`;
    };
    // middleware
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _logMiddleware = function (req, res, next) {
        if (req.originalUrl) {
            console.log(`${req.method} - ${req.originalUrl}`);
        }
        return next();
    };
    const validatorMiddleware = function (req, res, next) {
        var _a;
        const [request_id, token] = [req.get('X-Request-Id'), (_a = req.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1]];
        if (request_id && token)
            return next();
        return res.sendStatus(404);
    };
    const authenticationMiddleware = (node) => {
        return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const cache = node.cache;
            const token = (_a = req.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            const key = `${token}-${node.id}`;
            if (cache.get(key)) {
                return next();
            }
            try {
                const response = yield api_1.Api.login(token);
                if ((_b = response === null || response === void 0 ? void 0 : response.data) === null || _b === void 0 ? void 0 : _b.id) {
                    cache.set(key, response.data);
                }
                else {
                    return res.sendStatus(401);
                }
            }
            catch (error) {
                return res.sendStatus(401);
            }
            return next();
        });
    };
    // route
    const pong = (req, res) => res.sendStatus(200);
    const unlink = (node) => {
        return (req, res) => {
            var _a;
            const cache = node.cache;
            const token = (_a = req.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            const key = `${token}-${node.id}`;
            if (cache.get(key)) {
                cache.del(key);
                return res.sendStatus(200);
            }
            return res.sendStatus(404);
        };
    };
    const devices = (node) => {
        return (req, res) => {
            const request_id = req.get('X-Request-Id');
            const json = {
                request_id: request_id,
                payload: {
                    user_id: node.id,
                    devices: []
                }
            };
            RED.nodes.eachNode(n => {
                var _a;
                const device = RED.nodes.getNode(n.id);
                if ((device === null || device === void 0 ? void 0 : device.device) && ((_a = device === null || device === void 0 ? void 0 : device.config) === null || _a === void 0 ? void 0 : _a.service) == node.id) {
                    json.payload.devices.push(device.device);
                }
            });
            return res.json(json);
        };
    };
    const query = (node) => {
        return (req, res) => {
            var _a;
            const request_id = req.get('X-Request-Id');
            const devices = (_a = req.body) === null || _a === void 0 ? void 0 : _a.devices;
            const json = {
                request_id: request_id,
                payload: {
                    user_id: node.id,
                    devices: []
                }
            };
            devices.forEach((d) => {
                var _a;
                const device = RED.nodes.getNode(d.id);
                if ((device === null || device === void 0 ? void 0 : device.device) && ((_a = device === null || device === void 0 ? void 0 : device.config) === null || _a === void 0 ? void 0 : _a.service) == node.id) {
                    json.payload.devices.push(device.device);
                }
                else {
                    json.payload.devices.push({
                        id: d.id,
                        error_code: 'DEVICE_NOT_FOUND',
                        error_message: `device '${d.id})' not found`
                    });
                }
            });
            return res.json(json);
        };
    };
    const action = (node) => {
        return (req, res) => {
            var _a, _b;
            const request_id = req.get('X-Request-Id');
            const devices = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.devices;
            const json = {
                request_id: request_id,
                payload: {
                    user_id: node.id,
                    devices: []
                }
            };
            devices.forEach((d) => {
                var _a;
                const device = RED.nodes.getNode(d.id);
                if ((device === null || device === void 0 ? void 0 : device.device) && ((_a = device === null || device === void 0 ? void 0 : device.config) === null || _a === void 0 ? void 0 : _a.service) == node.id) {
                    const capabilities = [];
                    d.capabilities.forEach((c) => {
                        // state device
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
                    json.payload.devices.push({
                        id: d.id,
                        capabilities: capabilities
                    });
                }
                else {
                    json.payload.devices.push({
                        id: d.id,
                        error_code: 'DEVICE_NOT_FOUND',
                        error_message: `device '${d.id})' not found`
                    });
                }
            });
            return res.json(json);
        };
    };
    const publish = function (self) {
        const credentials = self.credentials;
        const path = buildPath(credentials.path);
        // https://yandex.ru/dev/dialogs/smart-home/doc/reference/resources.html#rest
        const route = {
            base: path,
            pong: `${path}/v1.0/`,
            unlink: `${path}/v1.0/user/unlink`,
            devices: `${path}/v1.0/user/devices`,
            query: `${path}/v1.0/user/devices/query`,
            action: `${path}/v1.0/user/devices/action`,
            // middleware
            middleware: `${path}/v1.0/user/`
        };
        // middleware
        // RED.httpNode.use(route.base, _logMiddleware); // log
        RED.httpNode.use(route.middleware, validatorMiddleware); // validatorMiddleware
        RED.httpNode.use(route.middleware, authenticationMiddleware(self)); // authenticationMiddleware
        // route
        RED.httpNode.head(route.pong, pong);
        RED.httpNode.post(route.unlink, unlink(self));
        RED.httpNode.get(route.devices, devices(self));
        RED.httpNode.post(route.query, query(self));
        RED.httpNode.post(route.action, action(self));
    };
    const unpublish = function (self) {
        const credentials = self.credentials;
        const path = buildPath(credentials.path);
        const pathRegexp = new RegExp(`^${path}`, 'g');
        for (let i = RED.httpNode._router.stack.length - 1; i >= 0; --i) {
            const route = RED.httpNode._router.stack[i];
            if (route.route && route.route.path.match(pathRegexp)) {
                // console.log(`${i} - delete - ${route.route.path}`);
                RED.httpNode._router.stack.splice(i, 1);
            }
        }
    };
    return {
        publish,
        unpublish
    };
};
//# sourceMappingURL=webhook.js.map