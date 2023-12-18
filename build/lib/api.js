"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.Api = void 0;
const axios_1 = __importDefault(require("axios"));
const util_1 = require("util");
const axios_retry_1 = __importStar(require("axios-retry"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Package = require('../../package.json');
// if someone will be read this code
// I say: "Yandex sorry for axiosRetry"
// i know, i fix 5xx from response (Yandex),
// but make more 5xx for other ...
const userAgent = `${Package.name.trim()}/${Package.version.trim()} Node-RED`;
exports.Api = {
    // https://yandex.ru/dev/id/doc/ru/user-information
    login: (token) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        (0, axios_retry_1.default)(axios_1.default, {
            retries: 3,
            retryDelay: retryCount => retryCount * 75,
            retryCondition: axios_retry_1.isRetryableError,
            shouldResetTimeout: true
        });
        const _options = {
            method: 'GET',
            timeout: 300,
            url: 'https://login.yandex.ru/info',
            headers: {
                Authorization: `OAuth ${token}`,
                'User-Agent': userAgent
            }
        };
        try {
            return yield axios_1.default.request(_options);
        }
        catch (e) {
            const error = e;
            let msg = `${(_a = error.response) === null || _a === void 0 ? void 0 : _a.status} - ${error.message}`;
            if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) && typeof ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === 'object') {
                msg = `${(_d = error.response) === null || _d === void 0 ? void 0 : _d.status} - ${(0, util_1.inspect)((_e = error.response) === null || _e === void 0 ? void 0 : _e.data)}`;
            }
            throw new Error(msg);
        }
    }),
    // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-state.html
    callback_state: (service, device) => __awaiter(void 0, void 0, void 0, function* () {
        var _f, _g, _h, _j, _k;
        const credentials = service.credentials;
        const ts = Date.now() / 1000;
        (0, axios_retry_1.default)(axios_1.default, {
            retries: 10,
            retryDelay: retryCount => retryCount * 75,
            retryCondition: axios_retry_1.isRetryableError,
            shouldResetTimeout: true
        });
        const _options = {
            method: 'POST',
            timeout: 750,
            url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/state`,
            headers: {
                Authorization: `OAuth ${credentials.oauth_token}`,
                'User-Agent': userAgent,
                'Content-Type': 'application/json'
            },
            data: {
                ts: ts,
                payload: {
                    user_id: service.id,
                    devices: [device]
                }
            }
        };
        try {
            return yield axios_1.default.request(_options);
        }
        catch (e) {
            const error = e;
            let msg = `${(_f = error.response) === null || _f === void 0 ? void 0 : _f.status} - ${error.message}`;
            if (((_g = error.response) === null || _g === void 0 ? void 0 : _g.data) && typeof ((_h = error.response) === null || _h === void 0 ? void 0 : _h.data) === 'object') {
                msg = `${(_j = error.response) === null || _j === void 0 ? void 0 : _j.status} - ${(0, util_1.inspect)((_k = error.response) === null || _k === void 0 ? void 0 : _k.data)}`;
            }
            throw new Error(msg);
        }
    }),
    // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-discovery.html
    callback_discovery: (service) => {
        const credentials = service.credentials;
        const ts = Date.now() / 1000;
        (0, axios_retry_1.default)(axios_1.default, {
            retries: 10,
            retryDelay: retryCount => retryCount * 75,
            retryCondition: axios_retry_1.isRetryableError,
            shouldResetTimeout: true
        });
        const _options = {
            method: 'POST',
            timeout: 750,
            url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/discovery`,
            headers: {
                Authorization: `OAuth ${credentials.oauth_token}`,
                'User-Agent': userAgent,
                'Content-Type': 'application/json'
            },
            data: {
                ts: ts,
                payload: {
                    user_id: service.id
                }
            }
        };
        return axios_1.default.request(_options).catch((error) => {
            var _a, _b, _c, _d, _e;
            let msg = `${(_a = error.response) === null || _a === void 0 ? void 0 : _a.status} - ${error.message}`;
            if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) && typeof ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === 'object') {
                msg = `${(_d = error.response) === null || _d === void 0 ? void 0 : _d.status} - ${(0, util_1.inspect)((_e = error.response) === null || _e === void 0 ? void 0 : _e.data)}`;
            }
            throw new Error(msg);
        });
    }
};
//# sourceMappingURL=api.js.map