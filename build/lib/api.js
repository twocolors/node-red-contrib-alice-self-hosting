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
exports.callback_discovery = exports.callback_state = exports.login = void 0;
const axios_1 = __importDefault(require("axios"));
const util_1 = require("util");
const axios_retry_1 = __importStar(require("axios-retry"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Package = require('../../package.json');
// if someone will be read this code
// I say: "Yandex sorry for axiosRetry"
// i know, i fix 5xx from response (Yandex),
// but make more 5xx for other ...
axios_1.default.defaults.headers.common['User-Agent'] = `${Package.name.trim()}/${Package.version.trim()} Node-RED`;
const _error = function (error) {
    var _a, _b, _c, _d;
    let text = `${(_a = error.response) === null || _a === void 0 ? void 0 : _a.status} - ${error.message}`;
    if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) && typeof ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === 'object') {
        text = `${text}\n${(0, util_1.inspect)((_d = error.response) === null || _d === void 0 ? void 0 : _d.data)}`;
    }
    return text;
};
const _request = function (options, retries, retryDelay) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, axios_retry_1.default)(axios_1.default, {
            retries: retries,
            retryDelay: retryCount => retryCount * retryDelay,
            retryCondition: axios_retry_1.isRetryableError
        });
        try {
            return yield axios_1.default.request(options);
        }
        catch (error) {
            throw new Error(_error(error));
        }
    });
};
// https://yandex.ru/dev/id/doc/ru/user-information
const login = function (token) {
    const _options = {
        method: 'GET',
        url: 'https://login.yandex.ru/info',
        headers: {
            Authorization: `OAuth ${token}`
        }
    };
    return _request(_options, 3, 150);
};
exports.login = login;
// https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-state.html
const callback_state = function (service, device) {
    const credentials = service.credentials;
    const ts = Date.now() / 1000;
    const _options = {
        method: 'POST',
        url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/state`,
        headers: {
            Authorization: `OAuth ${credentials.oauth_token}`,
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
    return _request(_options, 8, 200);
};
exports.callback_state = callback_state;
// https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-discovery.html
const callback_discovery = function (service) {
    const credentials = service.credentials;
    const ts = Date.now() / 1000;
    const _options = {
        method: 'POST',
        url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/discovery`,
        headers: {
            Authorization: `OAuth ${credentials.oauth_token}`,
            'Content-Type': 'application/json'
        },
        data: {
            ts: ts,
            payload: {
                user_id: service.id
            }
        }
    };
    return _request(_options, 5, 150);
};
exports.callback_discovery = callback_discovery;
//# sourceMappingURL=api.js.map