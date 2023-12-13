import {NodeAPI} from 'node-red';
import {Storage} from '../lib/storage';
import * as path from 'path';

module.exports = (RED: NodeAPI) => {
  const webhook = require('../lib/webhook')(RED);

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

  let userDir = path.join(require('os').homedir(), '.node-red');
  if (RED.settings.available() && RED.settings.userDir) {
    userDir = RED.settings.userDir;
  }

  Storage.init(userDir, 'alice-sh').then(() => {
    RED.nodes.registerType(
      'alice-sh-service',
      function (this: any, config: any) {
        const self = this;
        self.config = config;
        RED.nodes.createNode(self, config);

        try {
          credentialsValidator(self.credentials);
          webhook.publish(self);
        } catch (error: any) {
          self.error(error);
          return;
        }

        self.on('close', function (removed: any, done: () => any) {
          webhook.unpublish(self);
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
  });
};
