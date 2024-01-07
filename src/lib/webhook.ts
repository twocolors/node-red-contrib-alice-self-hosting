import {NodeAPI} from 'node-red';
import {NodeServiceType, NodeDeviceType} from './types';
import express from 'express';
import http from 'node:http';
import bodyParser from 'body-parser';
import {Api} from './api';
import NanoCache from 'nano-cache';
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
      if (request_id && token) return next();
      return res.status(400).json({error: 'not validate request_id or token'});
    };
  };
  const authenticationMiddleware = (node: NodeServiceType) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const cache: NanoCache = node.cache;
      const token: string | undefined = req.get('Authorization')?.split(' ')[1];
      const key: string = `${token}-${node.id}`;

      if (cache.get(key)) {
        return next();
      }

      try {
        const response = await Api.login(token);
        if (response?.data?.id) {
          cache.set(key, response.data);
        } else {
          return res.status(401).json({error: response?.data});
        }
      } catch (error: any) {
        return res.status(401).json({error: error.message});
      }

      return next();
    };
  };

  // route
  const pong = (req: express.Request, res: express.Response) => res.sendStatus(200);
  const unlink = (node: NodeServiceType) => {
    return (req: express.Request, res: express.Response) => {
      const cache: NanoCache = node.cache;
      const token: string | undefined = req.get('Authorization')?.split(' ')[1];
      const key: string = `${token}-${node.id}`;

      if (cache.get(key)) cache.del(key);

      return res.sendStatus(200);
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

      return res.json(json);
    };
  };
  const query = (node: NodeServiceType) => {
    return (req: express.Request, res: express.Response) => {
      const request_id: string | undefined = req.get('X-Request-Id');
      const devices: any = req.body?.devices;

      if (!devices) return res.status(400).json({error: 'devices is empty'});

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

      return res.json(json);
    };
  };
  const action = (node: NodeServiceType) => {
    return (req: express.Request, res: express.Response) => {
      const request_id: string | undefined = req.get('X-Request-Id');
      const devices: any = req.body?.payload?.devices;

      if (!devices) return res.status(400).json({error: 'devices is empty'});

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

      return res.json(json);
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
      // parse application/x-www-form-urlencoded
      self.app.use(bodyParser.urlencoded({extended: false}));
      // parse application/json
      self.app.use(bodyParser.json());
      self.server = http.createServer(self.app).listen(self.config.port);
    }

    const app: express.Express = self.app || RED.httpNode;

    // debug
    if (self.config.debug) morganBody(app, {maxBodyLength: 10000});
    // middleware
    app.use(route.middleware, validatorMiddleware(self)); // validatorMiddleware
    app.use(route.middleware, authenticationMiddleware(self)); // authenticationMiddleware
    // route
    app.get(route.base, pong);
    app.head(route.pong, pong);
    app.post(route.unlink, unlink(self));
    app.get(route.devices, devices(self));
    app.post(route.query, query(self));
    app.post(route.action, action(self));
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
