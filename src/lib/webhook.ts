import {NodeAPI} from 'node-red';
import {NodeServiceType, NodeDeviceType} from './types';
import express from 'express';
import http from 'node:http';
import bodyParser from 'body-parser';
import {login} from './api';
import {LRUCache} from 'lru-cache';
import morganBody from 'morgan-body';

module.exports = (RED: NodeAPI) => {
  // helper
  const buildPath = function (path: string): string {
    return `/${path.replace(/^\/|\/$/g, '')}/webhook`;
  };

  // middleware
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validatorMiddleware = (node: NodeServiceType) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const [request_id, token] = [req.get('X-Request-Id'), req.get('Authorization')?.split(' ')[1]];
      if (request_id && token) {
        next();
      } else {
        res.status(400).json({error: 'not validate request_id or token'});
      }
      return;
    };
  };
  const authenticationMiddleware = (node: NodeServiceType) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const cache: LRUCache<string, any> = node.cache;
      const token: string | undefined = req.get('Authorization')?.split(' ')[1];
      const keyCache: string = `${node.id};${token}`;

      if (cache.get(keyCache)) {
        next();
        return;
      }

      try {
        const response = await login(token);
        if (response?.data?.id) {
          // cache for 7 days
          cache.set(keyCache, response.data, {ttl: 1000 * 60 * 60 * 24 * 7});
        } else {
          res.status(401).json({error: response?.data});
          return;
        }
      } catch (error: any) {
        res.status(401).json({error: error.message});
        return;
      }

      next();
      return;
    };
  };

  // route
  const pong = (req: express.Request, res: express.Response) => {
    res.sendStatus(200);
    return;
  };
  const unlink = (node: NodeServiceType) => {
    return (req: express.Request, res: express.Response) => {
      const cache: LRUCache<string, any> = node.cache;
      const token: string | undefined = req.get('Authorization')?.split(' ')[1];
      const keyCache: string = `${node.id};${token}`;

      if (cache.get(keyCache)) cache.delete(keyCache);

      res.sendStatus(200);
      return;
    };
  };
  const devices = (node: NodeServiceType) => {
    return (req: express.Request, res: express.Response) => {
      const request_id: string | undefined = req.get('X-Request-Id');

      const json: any = {
        request_id: request_id,
        payload: {
          user_id: node.id,
          devices: []
        }
      };

      RED.nodes.eachNode(n => {
        const device: NodeDeviceType = RED.nodes.getNode(n.id) as NodeDeviceType;
        if (device?.device && device?.config?.service == node.id) {
          json.payload.devices.push(device.device);
        }
      });

      res.json(json);
      return;
    };
  };
  const query = (node: NodeServiceType) => {
    return (req: express.Request, res: express.Response) => {
      const request_id: string | undefined = req.get('X-Request-Id');
      const devices: any = req.body?.devices;

      if (!devices) {
        res.status(400).json({error: 'devices is empty'});
        return;
      }

      const json: any = {
        request_id: request_id,
        payload: {
          user_id: node.id,
          devices: []
        }
      };

      devices.forEach((d: any) => {
        const device: NodeDeviceType = RED.nodes.getNode(d.id) as NodeDeviceType;
        if (device?.device && device?.config?.service == node.id) {
          json.payload.devices.push(device.device);
        } else {
          json.payload.devices.push({
            id: d.id,
            error_code: 'DEVICE_NOT_FOUND',
            error_message: `device '${d.id})' not found`
          });
        }
      });

      res.json(json);
      return;
    };
  };
  const action = (node: NodeServiceType) => {
    return (req: express.Request, res: express.Response) => {
      const request_id: string | undefined = req.get('X-Request-Id');
      const devices: any = req.body?.payload?.devices;

      if (!devices) {
        res.status(400).json({error: 'devices is empty'});
        return;
      }

      const json: any = {
        request_id: request_id,
        payload: {
          user_id: node.id,
          devices: []
        }
      };

      devices.forEach((d: any) => {
        const device: NodeDeviceType = RED.nodes.getNode(d.id) as NodeDeviceType;
        if (device?.device && device?.config?.service == node.id) {
          const capabilities: any = [];

          d.capabilities.forEach((c: any) => {
            const findCapability: any = device.findCapability(c.type, c.state.instance);
            const capability: any = {
              type: c.type,
              state: {
                instance: c.state.instance,
                action_result: {
                  status: 'DONE'
                }
              }
            };

            if (findCapability) {
              // state device
              device.onState(c);

              // https://yandex.ru/dev/dialogs/smart-home/doc/concepts/video_stream.html?lang=en
              if (c.type == 'devices.capabilities.video_stream') {
                capability.state.value = findCapability.state.value;
              }
            } else {
              capability.state.action_result = {
                status: 'ERROR',
                error_code: 'INVALID_ACTION',
                error_message: `capability '${c.type}' with instance '${c.state.instance}' not found`
              };
            }

            capabilities.push(capability);
          });

          json.payload.devices.push({
            id: d.id,
            capabilities: capabilities
          });
        } else {
          json.payload.devices.push({
            id: d.id,
            error_code: 'DEVICE_NOT_FOUND',
            error_message: `device '${d.id}' not found`
          });
        }
      });

      res.json(json);
      return;
    };
  };

  const publish = function (self: NodeServiceType) {
    const credentials: any = self.credentials;
    const path: string = buildPath(credentials.path);

    // https://yandex.ru/dev/dialogs/smart-home/doc/reference/resources.html#rest
    const route: any = {
      base: path,
      pong: `${path}/v1.0/`,
      unlink: `${path}/v1.0/user/unlink`,
      devices: `${path}/v1.0/user/devices`,
      query: `${path}/v1.0/user/devices/query`,
      action: `${path}/v1.0/user/devices/action`,
      // middleware
      middleware: `${path}/v1.0/user/`
    };

    if (self.config.port && self.config.port != RED.settings.uiPort) {
      self.app = express();
      self.app.disable('x-powered-by');
      self.server = http.createServer(self.app).listen(self.config.port);
    }

    const app: express.Express = self.app || RED.httpNode;

    // middleware parser
    const apiMaxLength = RED.settings.apiMaxLength || '5mb';
    // parse application/x-www-form-urlencoded
    const urlencodedParser = bodyParser.urlencoded({limit: apiMaxLength, extended: true});
    // parse application/json
    const jsonParser = bodyParser.json({limit: apiMaxLength});

    // debug
    if (self.config.debug) morganBody(app, {maxBodyLength: 10_000_000});
    // middleware
    app.use(route.middleware, urlencodedParser, jsonParser, validatorMiddleware(self)); // validatorMiddleware
    app.use(route.middleware, urlencodedParser, jsonParser, authenticationMiddleware(self)); // authenticationMiddleware
    // route
    app.get(route.base, urlencodedParser, jsonParser, pong);
    app.head(route.pong, urlencodedParser, jsonParser, pong);
    app.post(route.unlink, urlencodedParser, jsonParser, unlink(self));
    app.get(route.devices, urlencodedParser, jsonParser, devices(self));
    app.post(route.query, urlencodedParser, jsonParser, query(self));
    app.post(route.action, urlencodedParser, jsonParser, action(self));
  };

  const unpublish = function (self: NodeServiceType) {
    const credentials: any = self.credentials;
    const path: string = buildPath(credentials.path);
    const pathRegexp: RegExp = new RegExp(`^${path}`, 'g');
    const app: express.Express = self.app || RED.httpNode;

    for (let i = app._router.stack.length - 1; i >= 0; --i) {
      const route = app._router.stack[i];
      if (route.route && route.route.path.match(pathRegexp)) {
        app._router.stack.splice(i, 1);
      }
    }

    if (self.server) self.server.close();
  };

  return {
    publish,
    unpublish
  };
};
