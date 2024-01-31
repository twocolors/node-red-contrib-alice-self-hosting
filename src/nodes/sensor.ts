import {NodeAPI} from 'node-red';
import {NodeDeviceType} from '../lib/types';
import {Status} from '../lib/status';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-sensor', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const device = RED.nodes.getNode(config.device) as NodeDeviceType;
    const ptype = config.ptype;
    const instance = config.instance;
    const unit = config.unit;
    const retrievable = true;
    const reportable = true;

    // helpers
    self.statusHelper = new Status(self);

    // device not init
    if (!device || !device.init) return;
    // init
    const keyCache = `${self.id}-${ptype}-${instance}`;
    let value = device.cache.get(keyCache) || Number(0.0);

    // init
    try {
      self.statusHelper.clear();

      device.setProperty(
        {
          type: ptype,
          retrievable: retrievable,
          reportable: reportable,
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
    } catch (error: any) {
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

    self.on('input', async (msg: any) => {
      if (typeof msg.payload !== 'number') {
        self.statusHelper.set(
          {
            fill: 'red',
            shape: 'dot',
            text: 'Wrong type! msg.payload must be number'
          },
          3000
        );
        return;
      }
      const payload: number = Number(msg.payload.toFixed(2));

      if (value == payload) return;

      self.statusHelper.set({fill: 'yellow', shape: 'dot', text: payload}, 3000);

      device.updateState(payload, ptype, instance);

      try {
        await device.updateStateDevice();

        value = payload;
        device.cache.set(keyCache, value);

        setTimeout(
          () =>
            self.statusHelper.set(
              {
                fill: 'blue',
                shape: 'ring',
                text: 'Ok'
              },
              3000
            ),
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
        } catch (_) {
          /* empty */
        }
        try {
          await device.updateStateDevice();
        } catch (_) {
          /* empty */
        }
      }
      done();
    });
  });
};
