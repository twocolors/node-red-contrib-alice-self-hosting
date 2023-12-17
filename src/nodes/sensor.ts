import {NodeAPI} from 'node-red';
import {NodeDeviceType} from '../lib/types';
import {Status} from '../lib/status';
import {inspect} from 'util';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-sensor', function (this: any, config: any) {
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const name = config.name;
    const device = RED.nodes.getNode(config.device) as NodeDeviceType;
    const ptype = config.ptype;
    const instance = config.instance;
    const unit = config.unit;
    const retrievable = true;
    const reportable = true; // reportable = response

    // helpers
    self.statusHelper = new Status(self);

    // device not init
    if (!device) return;
    // init
    const keyCache = `${self.id}-${ptype}-${instance}`;
    let value = device.cache.get(keyCache) || Number(0.0);

    // init
    try {
      self.statusHelper.clear();

      device.setProperty(
        {
          type: ptype,
          reportable: reportable,
          retrievable: retrievable,
          parameters: {
            instance: instance,
            unit: unit
          },
          state: {
            instance: instance,
            value: value
          }
        },
        ptype,
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
      if (typeof payload != 'number') {
        self.statusHelper.set(
          {
            fill: 'red',
            shape: 'dot',
            text: `Wrong type! msg.payload must be number`
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

      device.updateState(payload, ptype, instance);

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
        device.updateState(value, ptype, instance);

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

    self.on('close', async (removed: boolean, done: any) => {
      device.removeProperty(ptype, instance);
      if (removed) {
        device.cache.del(keyCache);
        try {
          await device.updateInfoDevice();
        } catch (_) {}
        try {
          await device.updateStateDevice();
        } catch (_) {}
      }
      done();
    });
  });
};
