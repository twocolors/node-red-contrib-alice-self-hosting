"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lru_cache_1 = require("lru-cache");
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
    // use cache
    const cache = new lru_cache_1.LRUCache({ max: 10000 });
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