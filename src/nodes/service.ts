import {NodeAPI} from 'node-red';
import NanoCache from 'nano-cache';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const http = require('http');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');

module.exports = (RED: NodeAPI) => {
  const credentialsValidator = function (credentials: any) {
    if (!credentials?.skill_id) {
      throw new Error('Parameter `Skill Id` is required');
    }
    if (!credentials?.oauth_token) {
      throw new Error('Parameter `OAuth Token` is required');
    }
    if (!credentials?.path) {
      throw new Error('Parameter `Path Url` is required');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webhook = require('../lib/webhook')(RED);

  // use cache (14 days and 4 MB)
  const cache: NanoCache = new NanoCache({
    ttl: 1000 * 60 * 60 * 24 * 14,
    maxEvictBytes: 4 * NanoCache.SIZE.MB
  });

  RED.nodes.registerType(
    'alice-sh-service',
    function (this: any, config: any) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      self.config = config;
      RED.nodes.createNode(self, config);

      try {
        credentialsValidator(self.credentials);

        if (config.port && config.port != RED.settings.uiPort) {
          self.app = express();
          self.server = http.createServer(self.app).listen(config.port);
        }

        self.cache = cache;

        webhook.publish(self);
      } catch (error: any) {
        self.error(error);
        return;
      }

      self.on('close', function (removed: any, done: () => any) {
        if (self.cache) self.cache.clear();
        if (self.server) {
          self.server.close();
        } else {
          webhook.unpublish(self);
        }
        done();
      });
    },
    {
      credentials: {
        skill_id: {type: 'text'},
        oauth_token: {type: 'text'},
        path: {type: 'text'}
      }
    }
  );
};
