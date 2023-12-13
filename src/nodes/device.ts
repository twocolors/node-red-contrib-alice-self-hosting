import {NodeAPI, runtime} from 'node-red';
import {Storage} from '../lib/storage';
import {StorageUserType} from '../lib/types';
import {Api} from '../lib/api';
import {AxiosError} from 'axios';
import {inspect} from 'util';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-device', function (this: any, config: any) {
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);
    self.setMaxListeners(0);

    // var
    const name = config.name;
    const service = RED.nodes.getNode(config.service) as any;
    const description = config.description;
    const room = config.room;
    const dtype = config.dtype;
    const access = config.access;

    // bad hack for storage
    self.storage = {};

    // device
    self.device = {
      id: self.id,
      name: name,
      description: description,
      room: room,
      type: dtype,
      device_info: {
        manufacturer: 'Node-RED',
        model: 'virtual device',
        sw_version: 'test v1'
      },
      capabilities: [],
      properties: []
    };

    self.onState = function (object: any) {
      self.emit('onState', object);
    };

    // help
    function convertToYandexValue(val: any, actType: string) {
      switch (actType) {
        case 'range':
        case 'float': {
          if (val == undefined) return Number(0.0);
          try {
            const value = parseFloat(val);
            return isNaN(value) ? Number(0.0) : value;
          } catch (e) {
            return Number(0.0);
          }
        }
        case 'toggle':
        case 'on_off': {
          if (val == undefined) return false;
          if (['true', 'on', '1'].indexOf(String(val).toLowerCase()) != -1) return true;
          else return false;
        }
        default:
          return val;
      }
    }

    // capabilities
    self.findCapability = function (type: string, instance: any) {
      const {capabilities} = self.device;
      if (instance !== undefined) {
        return capabilities.find((p: any) => p.type === type && p.state?.instance === instance);
      } else {
        return capabilities.find((p: any) => p.type === type);
      }
    };

    self.setCapability = function (c: any, type: string, instance: any) {
      const capabilities = self.findCapability(type, instance);
      if (c !== undefined && capabilities === undefined) {
        self.device.capabilities.push(c);
      } else {
        throw new Error(`Parameters 'capability' is Dublicated on some Device!`);
      }
    };

    self.removeCapability = function (type: string, instance: any) {
      const index = self.device.capabilities.findIndex((p: any) => p.type === type && p.state?.instance === instance);
      if (index > -1) {
        self.device.capabilities.splice(index, 1);
      }
    };

    // properties
    self.findProperty = function (type: string, instance: any) {
      const {properties} = self.device;
      if (instance !== undefined) {
        return properties.find((p: any) => p.type === type && p.state?.instance === instance);
      } else {
        return properties.find((p: any) => p.type === type);
      }
    };

    self.setProperty = function (p: any, type: string, instance: any) {
      const property = self.findProperty(type, instance);
      if (p !== undefined && property === undefined) {
        self.device.properties.push(p);
      } else {
        throw new Error(`Parameters 'property' is Dublicated on some Device!`);
      }
    };

    self.removeProperty = function (type: string, instance: any) {
      const index = self.device.properties.findIndex((p: any) => p.type === type && p.state?.instance === instance);
      if (index > -1) {
        self.device.properties.splice(index, 1);
      }
    };

    // !!! update state !!!
    self.updateState = function (val: any, type: string, instance: any) {
      const {capabilities, properties} = self.device;

      try {
        const cp = []
          .concat(capabilities, properties)
          .find((cp: any) => cp.type === type && cp.state?.instance === instance) as any;
        if (cp === undefined) return;

        const actType = String(cp.type).split('.')[2];
        const value = convertToYandexValue(val, actType);
        cp.state = {instance, value: value};

        // save to storage
        self.storage[`${type}-${instance}`] = value;
      } catch (_) {}
    };

    // state device
    self.updateStateDevice = async function () {
      const node_id = service.id;
      const skill_id = service.credentials?.skill_id;
      const oauth_token = service.credentials?.oauth_token;
      const device = self.device;

      if (!skill_id) {
        throw new Error(`Parameters 'skill_id' is not set in parents`);
      }

      if (!oauth_token) {
        throw new Error(`Parameters 'oauth_token' is not set in parents`);
      }

      const users = await Storage.getUsersByNodeId(node_id);
      if (users?.length === 0) {
        return;
      }

      await users.forEach(async (u: StorageUserType) => {
        if (!access || access === undefined || access.split(',').includes(String(u.login))) {
          try {
            await Api.callback_state(skill_id, oauth_token, u, device);
          } catch (error) {
            const _error = error as AxiosError;
            const status = _error.response?.status;
            let text = _error.response?.data;
            if (typeof text === 'object') {
              text = inspect(text);
            }
            if (typeof text === 'string') {
              text = text.replace(/^\n+|\n+$/g, '');
            }
            self.error(`updateStateDevice(${u.login}): ${status} - ${text}`);
          }
        }
      });
    };

    // info device
    self.updateInfoDevice = async function () {
      const node_id = service.id;
      const skill_id = service.credentials?.skill_id;
      const oauth_token = service.credentials?.oauth_token;

      if (!skill_id) {
        throw new Error(`Parameters 'skill_id' is not set in parents`);
      }

      if (!oauth_token) {
        throw new Error(`Parameters 'oauth_token' is not set in parents`);
      }

      const users = await Storage.getUsersByNodeId(node_id);
      if (users?.length === 0) {
        return;
      }

      await users.forEach(async (u: StorageUserType) => {
        if (!access || access === undefined || access.split(',').includes(String(u.login))) {
          try {
            await Api.callback_discovery(skill_id, oauth_token, u);
          } catch (error) {
            const _error = error as AxiosError;
            const status = _error.response?.status;
            let text = _error.response?.data;
            if (typeof text === 'object') {
              text = inspect(text);
            }
            if (typeof text === 'string') {
              text = text.replace(/^\n+|\n+$/g, '');
            }
            self.error(`updateInfoDevice(${u.login}): ${status} - ${text}`);
          }
        }
      });
    };
  });
};
