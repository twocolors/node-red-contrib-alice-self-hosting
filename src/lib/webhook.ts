import {NodeAPI} from 'node-red';
import express from 'express';
import {NodeServiceType, NodeDeviceType} from './types';
import {Api} from './api';
import NanoCache from 'nano-cache';

module.exports = (RED: NodeAPI) => {
  // helper
  const buildPath = function (path: string): string {
    return `/${path.replace(/^\/|\/$/g, '')}/webhook`;
  };

  // middleware
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _logMiddleware = function (req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.originalUrl) {
      console.log(`${req.method} - ${req.originalUrl}`);
    }
    return next();
  };
  const validatorMiddleware = function (req: express.Request, res: express.Response, next: express.NextFunction) {
    const [request_id, token] = [req.get('X-Request-Id'), req.get('Authorization')?.split(' ')[1]];
    if (request_id && token) return next();
    return res.sendStatus(404);
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
          return res.sendStatus(401);
        }
      } catch (error) {
        return res.sendStatus(401);
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

      if (cache.get(key)) {
        cache.del(key);
        return res.sendStatus(200);
      }

      return res.sendStatus(404);
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
            // state device
            device.onState(c);

            capabilities.push({
              type: c.type,
              state: {
                instance: c.state.instance,
                action_result: {
                  status: 'DONE'
                }
              }
            });
          });

          json.payload.devices.push({
            id: d.id,
            capabilities: capabilities
          });
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

    // middleware
    // RED.httpNode.use(route.base, _logMiddleware); // log
    RED.httpNode.use(route.middleware, validatorMiddleware); // validatorMiddleware
    RED.httpNode.use(route.middleware, authenticationMiddleware(self)); // authenticationMiddleware
    // route
    RED.httpNode.get(route.base, pong);
    RED.httpNode.head(route.pong, pong);
    RED.httpNode.post(route.unlink, unlink(self));
    RED.httpNode.get(route.devices, devices(self));
    RED.httpNode.post(route.query, query(self));
    RED.httpNode.post(route.action, action(self));
  };

  const unpublish = function (self: NodeServiceType) {
    const credentials: any = self.credentials;
    const path: string = buildPath(credentials.path);
    const pathRegexp: RegExp = new RegExp(`^${path}`, 'g');

    for (let i = RED.httpNode._router.stack.length - 1; i >= 0; --i) {
      const route = RED.httpNode._router.stack[i];
      if (route.route && route.route.path.match(pathRegexp)) {
        // console.log(`${i} - delete - ${route.route.path}`);
        RED.httpNode._router.stack.splice(i, 1);
      }
    }
  };

  return {
    publish,
    unpublish
  };
};
