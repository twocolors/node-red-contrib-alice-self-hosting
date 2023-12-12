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
                reject(error);
            }
        }));
    }),
    // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-state.html
    callback_state: (skill_id, user, device) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const _options = {
                method: 'POST',
                timeout: 1500,
                url: `https://dialogs.yandex.net/api/v1/skills/${skill_id}/callback/state`,
                headers: {
                    'content-type': 'application/json',
                    Authorization: `OAuth ${user.token}`
                },
                data: {
                    ts: Math.floor(Date.now() / 1000),
                    payload: {
                        user_id: `${user.login}-${user.id}`,
                        devices: [device]
                    }
                }
            };
            try {
                const response = yield axios_1.default.request(_options);
                resolve(response.data);
            }
            catch (error) {
                reject(error);
            }
        }));
    }),
    // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-discovery.html
    callback_discovery: (skill_id, user) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const _options = {
                method: 'POST',
                timeout: 1500,
                url: `https://dialogs.yandex.net/api/v1/skills/${skill_id}/callback/discovery`,
                headers: {
                    'content-type': 'application/json',
                    Authorization: `OAuth ${user.token}`
                },
                data: {
                    ts: Math.floor(Date.now() / 1000),
                    payload: {
                        user_id: `${user.login}-${user.id}`
                    }
                }
            };
            try {
                const response = yield axios_1.default.request(_options);
                resolve(response.data);
            }
            catch (error) {
                reject(error);
            }
        }));
    })
};
//# sourceMappingURL=api.js.map