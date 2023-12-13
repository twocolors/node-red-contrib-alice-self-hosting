import {NodeAPI, Node} from 'node-red';
import express from 'express';
import {Storage} from './storage';
import {NodeConfigType, StorageUserType} from './types';
import {Api} from './api';

module.exports = (RED: NodeAPI) => {
  const _pong = (req: express.Request, res: express.Response) => {
    // console.log(req.route.path);
    res.sendStatus(200);
    return;
  };

  const _unlink = async (req: express.Request, res: express.Response) => {
    // console.log(req.route.path);
    // TODO: write middleware for validate ...
    const [request_id, token] = [req.get('X-Request-Id'), req.get('Authorization')?.split(' ')[1]];

    if (request_id === undefined || token === undefined) {
      res.sendStatus(401);
      return;
    }

    const user = await Storage.getUserByToken(token);
    if (user) {
      // TODO: bad hack
      try {
        await Storage.removeUser(user);
      } catch (_) {}
      res.sendStatus(200);
      return;
    }

    res.sendStatus(404);
    return;
  };

  const devices = (user: StorageUserType) => {
    const devices: any = [];
    RED.nodes.eachNode(node => {
      const device = RED.nodes.getNode(node.id) as NodeConfigType;
      if (device && device.config?.service && device.config?.service === user.node_id) {
        if (
          !device.config?.access ||
          device.config?.access === undefined ||
          device.config?.access?.split(',').includes(String(user.login))
        ) {
          devices.push(device.device);
        }
      }
    });
    return devices;
  };

  const _devices = async (node: Node, req: express.Request, res: express.Response) => {
    // console.log(req.route.path);
    // TODO: write middleware for validate ...
    const [request_id, token] = [req.get('X-Request-Id'), req.get('Authorization')?.split(' ')[1]];

    if (request_id === undefined || token === undefined) {
      res.sendStatus(401);
      return;
    }

    // TODO: write middleware for auth ...
    let user = (await Storage.getUserByToken(token)) as StorageUserType;
    if (!user) {
      try {
        user = await Api.login(token);
      } catch (error) {
        RED.log.error(`fail authorization user (${error})`);
        res.sendStatus(401);
        return;
      }
    }
    // TODO: MB change node.id (or empty) update User
    if (user.node_id === undefined || user.node_id != node.id) {
      await Storage.updateUser({...user, token, node_id: node.id} as StorageUserType);
    }

    let json = {
      request_id: request_id,
      payload: {
        user_id: `${user.login}-${user.id}`,
        devices: devices(user) as any
      }
    };

    res.status(200).json(json);
    return;
  };

  const query = (user: StorageUserType, id: any) => {
    const devices: any = [];
    id.forEach((e: any) => {
      const device = RED.nodes.getNode(e.id) as NodeConfigType;
      if (device && device.config?.service && device.config?.service === user.node_id) {
        if (
          !device.config?.access ||
          device.config?.access === undefined ||
          device.config?.access?.split(',').includes(String(user.login))
        ) {
          devices.push(device.device);
        } else {
          devices.push({
            id: e.id,
            error_code: 'DEVICE_NOT_FOUND',
            error_message: `device(${e.id}) not found or not access for user(${user.login})`
          });
        }
      }
    });
    return devices;
  };

  const _query = async (node: Node, req: express.Request, res: express.Response) => {
    // console.log(req.route.path);
    // TODO: write middleware for validate ...
    const [request_id, token] = [req.get('X-Request-Id'), req.get('Authorization')?.split(' ')[1]];

    if (request_id === undefined || token === undefined) {
      res.sendStatus(401);
      return;
    }

    // TODO: write middleware for auth ...
    let user = (await Storage.getUserByToken(token)) as StorageUserType;
    if (!user) {
      try {
        user = await Api.login(token);
      } catch (error) {
        RED.log.error(`fail authorization user (${error})`);
        res.sendStatus(401);
        return;
      }
    }
    // TODO: MB change node.id (or empty) update User
    if (user.node_id === undefined || user.node_id != node.id) {
      await Storage.updateUser({...user, token, node_id: node.id} as StorageUserType);
    }

    if (req.body?.devices === undefined || req.body?.devices?.length === 0) {
      res.sendStatus(404);
      return;
    }

    let json = {
      request_id: request_id,
      payload: {
        user_id: `${user.login}-${user.id}`,
        devices: query(user, req.body.devices) as any
      }
    };

    res.status(200).json(json);
    return;
  };

  const action = (user: StorageUserType, id: any) => {
    const devices: any = [];
    id.forEach((e: any) => {
      const device = RED.nodes.getNode(e.id) as NodeConfigType;
      if (device && device.config?.service && device.config?.service === user.node_id) {
        if (
          !device.config?.access ||
          device.config?.access === undefined ||
          device.config?.access?.split(',').includes(String(user.login))
        ) {
          const capabilities: any = [];
          e.capabilities.forEach((c: any) => {
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
          devices.push({
            id: e.id,
            capabilities: capabilities
          });
        } else {
          devices.push({
            id: e.id,
            action_result: {
              status: 'ERROR',
              error_code: 'DEVICE_NOT_FOUND',
              error_message: `device(${e.id}) not found or not access for user(${user.login})`
            }
          });
        }
      }
    });
    return devices;
  };

  const _action = async (node: Node, req: express.Request, res: express.Response) => {
    // console.log(req.route.path);
    // TODO: write middleware for validate ...
    const [request_id, token] = [req.get('X-Request-Id'), req.get('Authorization')?.split(' ')[1]];

    if (request_id === undefined || token === undefined) {
      res.sendStatus(401);
      return;
    }

    // TODO: write middleware for auth ...
    let user = (await Storage.getUserByToken(token)) as StorageUserType;
    if (!user) {
      try {
        user = await Api.login(token);
      } catch (error) {
        RED.log.error(`fail authorization user (${error})`);
        res.sendStatus(401);
        return;
      }
    }
    // TODO: MB change node.id (or empty) update User
    if (user.node_id === undefined || user.node_id != node.id) {
      await Storage.updateUser({...user, token, node_id: node.id} as StorageUserType);
    }

    if (req.body?.payload?.devices === undefined || req.body?.payload?.devices?.length === 0) {
      res.sendStatus(404);
      return;
    }

    let json = {
      request_id: request_id,
      payload: {
        user_id: `${user.login}-${user.id}`,
        devices: action(user, req.body.payload.devices) as any
      }
    };

    res.status(200).json(json);
    return;
  };

  const buildPath = function (path: string): string {
    return `/${path.replace(/^\/|\/$/g, '')}/webhook`;
  };

  const publish = function (self: Node) {
    const credentials: any = self.credentials;
    const path = buildPath(credentials.path);

    // HEAD /v1.0/                    Проверка доступности Endpoint URL провайдера
    RED.httpNode.head(`${path}/v1.0/`, (req: express.Request, res: express.Response) => _pong(req, res));
    // POST /v1.0/user/unlink         Оповещение о разъединении аккаунтов
    RED.httpNode.post(
      `${path}/v1.0/user/unlink`,
      async (req: express.Request, res: express.Response) => await _unlink(req, res)
    );
    // GET  /v1.0/user/devices        Информация об устройствах пользователя
    RED.httpNode.get(
      `${path}/v1.0/user/devices`,
      async (req: express.Request, res: express.Response) => await _devices(self, req, res)
    );
    // POST /v1.0/user/devices/query  Информация о состояниях устройств пользователя
    RED.httpNode.post(
      `${path}/v1.0/user/devices/query`,
      async (req: express.Request, res: express.Response) => await _query(self, req, res)
    );
    // POST /v1.0/user/devices/action	Изменение состояния у устройств
    RED.httpNode.post(
      `${path}/v1.0/user/devices/action`,
      async (req: express.Request, res: express.Response) => await _action(self, req, res)
    );
  };

  const unpublish = function (self: Node) {
    const credentials: any = self.credentials;
    const path = buildPath(credentials.path);
    const pathRegexp = new RegExp(`^${path}`, 'g');

    for (var i = RED.httpNode._router.stack.length - 1; i >= 0; --i) {
      let route = RED.httpNode._router.stack[i];
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
