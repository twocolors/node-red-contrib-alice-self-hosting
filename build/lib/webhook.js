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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_http_1 = __importDefault(require("node:http"));
const body_parser_1 = __importDefault(require("body-parser"));
const api_1 = require("./api");
const morgan_body_1 = __importDefault(require("morgan-body"));
module.exports = (RED) => {
    // helper
    const buildPath = function (path) {
        return `/${path.replace(/^\/|\/$/g, '')}/webhook`;
    };
    // middleware
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validatorMiddleware = (node) => {
        return (req, res, next) => {
            var _a;
            const [request_id, token] = [req.get('X-Request-Id'), (_a = req.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1]];
            if (request_id && token) {
                next();
            }
            else {
                res.status(400).json({ error: 'not validate request_id or token' });
            }
            return;
        };
    };
    const authenticationMiddleware = (node) => {
        return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const cache = node.cache;
            const token = (_a = req.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            const keyCache = `${node.id};${token}`;
            if (cache.get(keyCache)) {
                next();
                return;
            }
            try {
                const response = yield (0, api_1.login)(token);
                if ((_b = response === null || response === void 0 ? void 0 : response.data) === null || _b === void 0 ? void 0 : _b.id) {
                    // cache for 7 days
                    cache.set(keyCache, response.data, { ttl: 1000 * 60 * 60 * 24 * 7 });
                }
                else {
                    res.status(401).json({ error: response === null || response === void 0 ? void 0 : response.data });
                    return;
                }
            }
            catch (error) {
                res.status(401).json({ error: error.message });
                return;
            }
            next();
            return;
        });
    };
    // route
    const pong = (req, res) => {
        res.sendStatus(200);
        return;
    };
    const unlink = (node) => {
        return (req, res) => {
            var _a;
            const cache = node.cache;
            const token = (_a = req.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            const keyCache = `${node.id};${token}`;
            if (cache.get(keyCache))
                cache.delete(keyCache);
            res.sendStatus(200);
            return;
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
            if (node.config.debug)
                console.time('alice-sh|devices');
            RED.nodes.eachNode(n => {
                var _a;
                const device = RED.nodes.getNode(n.id);
                if ((device === null || device === void 0 ? void 0 : device.device) && ((_a = device === null || device === void 0 ? void 0 : device.config) === null || _a === void 0 ? void 0 : _a.service) == node.id) {
                    json.payload.devices.push(device.device);
                }
            });
            if (node.config.debug)
                console.timeEnd('alice-sh|devices');
            res.json(json);
            return;
        };
    };
    const query = (node) => {
        return (req, res) => {
            var _a;
            const request_id = req.get('X-Request-Id');
            const devices = (_a = req.body) === null || _a === void 0 ? void 0 : _a.devices;
            if (!devices) {
                res.status(400).json({ error: 'devices is empty' });
                return;
            }
            const json = {
                request_id: request_id,
                payload: {
                    user_id: node.id,
                    devices: []
                }
            };
            if (node.config.debug)
                console.time('alice-sh|devices/query');
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
            if (node.config.debug)
                console.timeEnd('alice-sh|devices/query');
            res.json(json);
            return;
        };
    };
    const action = (node) => {
        return (req, res) => {
            var _a, _b;
            const request_id = req.get('X-Request-Id');
            const devices = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.devices;
            if (!devices) {
                res.status(400).json({ error: 'devices is empty' });
                return;
            }
            const json = {
                request_id: request_id,
                payload: {
                    user_id: node.id,
                    devices: []
                }
            };
            if (node.config.debug)
                console.time('alice-sh|devices/action');
            devices.forEach((d) => {
                var _a;
                const device = RED.nodes.getNode(d.id);
                if ((device === null || device === void 0 ? void 0 : device.device) && ((_a = device === null || device === void 0 ? void 0 : device.config) === null || _a === void 0 ? void 0 : _a.service) == node.id) {
                    const capabilities = [];
                    d.capabilities.forEach((c) => {
                        const findCapability = device.findCapability(c.type, c.state.instance);
                        const capability = {
                            type: c.type,
                            state: {
                                instance: c.state.instance,
                                action_result: {
                                    status: 'DONE'
                                }
                            }
                        };
                        if (findCapability) {
                            if (node.config.debug)
                                console.time('alice-sh|devices/action/onState');
                            // state device
                            device.onState(c);
                            if (node.config.debug)
                                console.timeEnd('alice-sh|devices/action/onState');
                            // https://yandex.ru/dev/dialogs/smart-home/doc/concepts/video_stream.html?lang=en
                            if (c.type == 'devices.capabilities.video_stream') {
                                capability.state.value = findCapability.state.value;
                            }
                        }
                        else {
                            capability.state.action_result = {
                                status: 'ERROR',
                                error_code: 'INVALID_ACTION',
                                error_message: `capability '${c.type}' with instance '${c.state.instance}' not found`
                            };
                        }
                        capabilities.push(capability);
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
                        error_message: `device '${d.id}' not found`
                    });
                }
            });
            if (node.config.debug)
                console.timeEnd('alice-sh|devices/action');
            res.json(json);
            return;
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
        if (self.config.port && self.config.port != RED.settings.uiPort) {
            self.app = (0, express_1.default)();
            self.app.disable('x-powered-by');
            self.server = node_http_1.default.createServer(self.app).listen(self.config.port);
        }
        const app = self.app || RED.httpNode;
        // middleware parser
        const apiMaxLength = RED.settings.apiMaxLength || '5mb';
        // parse application/x-www-form-urlencoded
        const urlencodedParser = body_parser_1.default.urlencoded({ limit: apiMaxLength, extended: true });
        // parse application/json
        const jsonParser = body_parser_1.default.json({ limit: apiMaxLength });
        // debug
        if (self.config.debug)
            (0, morgan_body_1.default)(app, { maxBodyLength: 1000000000, prettify: false, includeNewLine: true });
        // middleware
        app.use(route.middleware, urlencodedParser, jsonParser, validatorMiddleware(self)); // validatorMiddleware
        app.use(route.middleware, urlencodedParser, jsonParser, authenticationMiddleware(self)); // authenticationMiddleware
        // route
        app.get(route.base, urlencodedParser, jsonParser, pong);
        app.head(route.pong, urlencodedParser, jsonParser, pong);
        app.post(route.unlink, urlencodedParser, jsonParser, unlink(self));
        app.get(route.devices, urlencodedParser, jsonParser, devices(self));
        app.post(route.query, urlencodedParser, jsonParser, query(self));
        app.post(route.action, urlencodedParser, jsonParser, action(self));
    };
    const unpublish = function (self) {
        const credentials = self.credentials;
        const path = buildPath(credentials.path);
        const pathRegexp = new RegExp(`^${path}`, 'g');
        const app = self.app || RED.httpNode;
        for (let i = app._router.stack.length - 1; i >= 0; --i) {
            const route = app._router.stack[i];
            if (route.route && route.route.path.match(pathRegexp)) {
                app._router.stack.splice(i, 1);
            }
        }
        if (self.server)
            self.server.close();
    };
    return {
        publish,
        unpublish
    };
};
//# sourceMappingURL=webhook.js.map