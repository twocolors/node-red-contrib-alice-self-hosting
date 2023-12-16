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
exports.Api = void 0;
const axios_1 = __importDefault(require("axios"));
exports.Api = {
    // https://yandex.ru/dev/id/doc/ru/user-information
    login: (token) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const _options = {
                method: 'GET',
                timeout: 1500,
                url: `https://login.yandex.ru/info`,
                headers: {
                    Authorization: `OAuth ${token}`
                }
            };
            try {
                const response = yield axios_1.default.request(_options);
                resolve(response.data);
            }
            catch (error) {
                let msg = `${error.response.status} - ${error.response.statusText}`;
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) && typeof ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === 'object') {
                    msg = `${error.response.data.error_code} - ${error.response.data.error_message}`;
                }
                reject(msg);
            }
        }));
    }),
    // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-state.html
    callback_state: (service, device) => {
        const credentials = service.credentials;
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const _options = {
                method: 'POST',
                timeout: 1500,
                url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/state`,
                headers: {
                    'content-type': 'application/json',
                    Authorization: `OAuth ${credentials.oauth_token}`
                },
                data: {
                    ts: Math.floor(Date.now() / 1000),
                    payload: {
                        user_id: service.id,
                        devices: [device]
                    }
                }
            };
            try {
                const response = yield axios_1.default.request(_options);
                resolve(response.data);
            }
            catch (error) {
                let msg = `${error.response.status} - ${error.response.statusText}`;
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) && typeof ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === 'object') {
                    msg = `${error.response.data.error_code} - ${error.response.data.error_message}`;
                }
                reject(msg);
            }
        }));
    },
    // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-discovery.html
    callback_discovery: (service) => {
        const credentials = service.credentials;
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const _options = {
                method: 'POST',
                timeout: 1500,
                url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/discovery`,
                headers: {
                    'content-type': 'application/json',
                    Authorization: `OAuth ${credentials.oauth_token}`
                },
                data: {
                    ts: Math.floor(Date.now() / 1000),
                    payload: {
                        user_id: service.id
                    }
                }
            };
            try {
                const response = yield axios_1.default.request(_options);
                resolve(response.data);
            }
            catch (error) {
                let msg = `${error.response.status} - ${error.response.statusText}`;
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) && typeof ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === 'object') {
                    msg = `${error.response.data.error_code} - ${error.response.data.error_message}`;
                }
                reject(msg);
            }
        }));
    }
};
//# sourceMappingURL=api.js.map