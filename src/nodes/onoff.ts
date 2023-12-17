import {NodeAPI} from 'node-red';
import {NodeDeviceType} from '../lib/types';
import {Status} from '../lib/status';
import {inspect} from 'util';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-onoff', function (this: any, config: any) {
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const name = config.name;
    const device = RED.nodes.getNode(config.device) as NodeDeviceType;
    const ctype = 'devices.capabilities.on_off';
    const instance = 'on';
    const retrievable = config.retrievable;
    const reportable = config.response; // reportable = response

    // helpers
    self.statusHelper = new Status(self);

    // device not init
    if (!device) return;
    // init
    const keyCache = `${self.id}-${ctype}-${instance}`;
    let value = device.cache.get(keyCache) || Boolean(false);

    // init
    try {
      device.setCapability(
        {
          type: ctype,
          reportable: reportable,
          retrievable: retrievable,
          state: {
            instance: instance,
            value: value
          },
          parameters: {
            instance: instance,
            split: !retrievable ? true : false
          }
        },
        ctype,
        instance
      );
    } catch (error) {
      self.error(error);
      self.statusHelper.set({
        fill: 'red',
        shape: 'dot',
        text: error
      });
      return;
    }

    device.updateInfoDevice().catch((error: any) => {
      self.error(`updateInfoDevice: ${error}`);
      self.statusHelper.set(
        {
          fill: 'red',
          shape: 'dot',
          text: error
        },
        5000
      );
    });

    self.on('input', async (msg: any, send: () => any, done: () => any) => {
      const payload: any = msg.payload;
      if (typeof payload != 'boolean') {
        self.statusHelper.set(
          {
            fill: 'red',
            shape: 'dot',
            text: `Wrong type! msg.payload must be boolean`
          },
          3000
        );
        return;
      }

      if (value == payload) return;

      let text: string = payload && typeof payload !== 'object' ? String(payload) : inspect(payload);
      if (text && text.length > 32) {
        text = `${text.substring(0, 32)}...`;
      }
      self.statusHelper.set({fill: 'yellow', shape: 'dot', text: text}, 3000);

      device.updateState(payload, ctype, instance);

      try {
        await device.updateStateDevice();

        value = payload;
        device.cache.set(keyCache, value);

        self.statusHelper.set(
          {
            fill: 'blue',
            shape: 'ring',
            text: 'Ok'
          },
          3000
        );
      } catch (error: any) {
        device.updateState(value, ctype, instance);

        self.error(`updateStateDevice: ${error}`);
        self.statusHelper.set(
          {
            fill: 'red',
            shape: 'dot',
            text: error
          },
          5000
        );
      }
    });

    const onState = (object: any) => {
      if (object?.type == ctype && object?.state?.instance == instance) {
        value = object?.state?.value;

        device.updateState(value, ctype, instance);

        device.cache.set(keyCache, value);

        self.send({
          payload: value,
          type: object?.type,
          instance: object?.state?.instance
        });

        if (reportable) {
          device.updateStateDevice().catch(error => self.error(`updateStateDevice: ${error}`));
        }
      }
    };

    device.on('onState', onState);

    self.on('close', async (removed: boolean, done: any) => {
      self.statusHelper.clear();
      device.removeCapability(ctype, instance);
      if (removed) {
        device.cache.del(keyCache);

        try {
          await device.updateInfoDevice();
        } catch (_) {}
        try {
          await device.updateStateDevice();
        } catch (_) {}
      }
      device.removeListener('onState', onState);
      done();
    });
  });
};
