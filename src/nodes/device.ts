import {NodeAPI} from 'node-red';
import {Api} from '../lib/api';
import {NodeServiceType} from '../lib/types';

module.exports = (RED: NodeAPI) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sw_version: string = require('../../package.json').version.trim();
  const hw_version: Promise<string> = RED.version();

  // helper
  // https://github.com/lasthead0/yandex2mqtt/blob/master/device.js#L4
  /* eslint-disable indent */
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
  /* eslint-enable indent */

  RED.nodes.registerType('alice-sh-device', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);
    self.setMaxListeners(0);

    // var
    self.service = RED.nodes.getNode(config.service) as NodeServiceType;
    self.cache = self.service.cache;

    // device init
    self.device = {
      id: self.id,
      name: config.name,
      description: config.description,
      room: config.room,
      type: config.dtype,
      device_info: {
        manufacturer: 'Node-RED',
        model: 'Virtual Device',
        sw_version,
        hw_version
      },
      capabilities: [],
      properties: []
    };

    // emit to state
    self.onState = function (object: any) {
      self.emit('onState', object);
    };

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
        throw new Error("Parameters 'capability' is Dublicated on some Device!");
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
        throw new Error("Parameters 'property' is Dublicated on some Device!");
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
      } catch (_) {
        /* empty */
      }
    };

    // state device
    self.updateStateDevice = () => Api.callback_state(self.service, self.device);

    // info device
    self.updateInfoDevice = () => Api.callback_discovery(self.service);
  });
};
