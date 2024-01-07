"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nano_cache_1 = __importDefault(require("nano-cache"));
module.exports = (RED) => {
    const credentialsValidator = function (credentials) {
        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.skill_id)) {
            throw new Error('Parameter `Skill Id` is required');
        }
        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.oauth_token)) {
            throw new Error('Parameter `OAuth Token` is required');
        }
        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.path)) {
            throw new Error('Parameter `Path` is required');
        }
    };
    // use cache (14 days and 4 MB)
    const cache = new nano_cache_1.default({
        ttl: 1000 * 60 * 60 * 24 * 14,
        maxEvictBytes: 4 * nano_cache_1.default.SIZE.MB
    });
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const webhook = require('../lib/webhook')(RED);
    RED.nodes.registerType('alice-sh-service', function (config) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        // vars
        self.init = false;
        self.cache = cache;
        try {
            credentialsValidator(self.credentials);
            webhook.publish(self);
            self.init = true;
        }
        catch (error) {
            self.error(error);
            return;
        }
        self.on('close', function (removed, done) {
            if (self.cache)
                self.cache.clear();
            webhook.unpublish(self);
            self.init = false;
            done();
        });
    }, {
        credentials: {
            skill_id: { type: 'text' },
            oauth_token: { type: 'text' },
            path: { type: 'text' }
        }
    });
};
//# sourceMappingURL=service.js.map