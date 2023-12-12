import {NodeAPI} from 'node-red';
import {Storage} from '../lib/storage';
import * as path from 'path';

module.exports = (RED: NodeAPI) => {
  const webhook = require('../lib/webhook')(RED);

  let userDir = path.join(require('os').homedir(), '.node-red');
  if (RED.settings.available() && RED.settings.userDir) {
    userDir = RED.settings.userDir;
  }

  Storage.init(userDir, 'alice-sh').then(() => {
    RED.nodes.registerType('alice-sh-service', function (this: any, config: any) {
      const self = this;
      self.config = config;

      RED.nodes.createNode(self, config);

      // re-init webhook
      if (config.path) {
        webhook.init(self);
      } else {
        self.error(`Not config 'Path Url' for webhook`);
      }

      self.on('close', function () {
        // delete webhook
        const _trim = (path: string) => path.replace(/^\/|\/$/g, '').split('/')[0];
        for (var i = RED.httpNode._router.stack.length - 1; i >= 0; --i) {
          let route = RED.httpNode._router.stack[i];
          if (route.route && _trim(route.route.path) === _trim(config.path)) {
            // console.log(`${i} - delete - ${route.route.path}`);
            RED.httpNode._router.stack.splice(i, 1);
          }
        }
      });
    });
  });
};
