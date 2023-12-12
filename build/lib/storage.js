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
exports.Storage = void 0;
const node_persist_1 = __importDefault(require("node-persist"));
const path_1 = __importDefault(require("path"));
class Storage {
    static init(storagePath, storageName) {
        return node_persist_1.default.init({ dir: path_1.default.resolve(storagePath, storageName) });
    }
    static getUserByToken(token) {
        return new Promise(resolve => {
            node_persist_1.default.values().then(values => {
                values.forEach((value) => {
                    if (value.token && value.token === token) {
                        resolve(value);
                    }
                });
                resolve(null);
            });
        });
    }
    static updateUser(user) {
        const key = user.login + '-' + user.id;
        return node_persist_1.default.updateItem(key, user);
    }
    static removeUser(user) {
        const key = user.login + '-' + user.id;
        return node_persist_1.default.removeItem(key);
    }
    static getUsersByNodeId(node_id) {
        return __awaiter(this, void 0, void 0, function* () {
            let users = [];
            yield node_persist_1.default.values().then(values => {
                values.forEach((value) => {
                    if (value.node_id && value.node_id === node_id) {
                        users.push(value);
                    }
                });
            });
            return Promise.all(users);
        });
    }
}
exports.Storage = Storage;
//# sourceMappingURL=storage.js.map