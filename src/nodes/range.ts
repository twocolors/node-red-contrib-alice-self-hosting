import {NodeAPI} from 'node-red';
import {NodeDeviceType} from '../lib/types';
import {Status} from '../lib/status';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-range', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const device = RED.nodes.getNode(config.device) as NodeDeviceType;
    const ctype = 'devices.capabilities.range';
    const instance = config.instance;
    const relative = config.relative;
    const retrievable = config.retrievable;
    const reportable = config.reportable;
    const unit = config.unit;
    const min = parseFloat(config.min) || 0;
    const max = parseFloat(config.max) || 100;
    const precision = parseFloat(config.precision) || 1;

    // helpers
    self.statusHelper = new Status(self);

    // device not init
    if (!device || !device.init) return;
    // init
    const keyCache = `${self.id}-${ctype}-${instance}`;
    let value = device.cache.get(keyCache) || Number(min);

    // init
    try {
      self.statusHelper.clear();

      device.setCapability(
        {
          type: ctype,
          retrievable: retrievable,
          reportable: reportable,
          state: {
            relative: relative,
            instance: instance,
            value: value
          },
          parameters: {
            instance: instance,
            unit: unit,
            random_access: true,
            range: {
              min: min,
              max: max,
              precision: precision
            }
          }
        },
        ctype,
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

      device.updateState(payload, ctype, instance);

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
        let _value = object?.state?.value;

        if (relative && object?.state?.relative) {
          _value = value + object?.state?.value;
          if (object?.state?.value < 0 && _value < min) _value = min;
          if (object?.state?.value > 0 && _value > max) _value = max;
        }

        value = _value;

        device.updateState(value, ctype, instance);

        device.cache.set(keyCache, value);

        self.send({
          payload: value,
          type: object?.type,
          instance: object?.state?.instance
        });

        self.statusHelper.set({fill: 'yellow', shape: 'dot', text: value}, 3000);

        if (reportable) {
          device.updateStateDevice().catch(error => self.error(`updateStateDevice: ${error}`));
        }
      }
    };

    device.on('onState', onState);

    self.on('close', async (removed: boolean, done: any) => {
      device.removeCapability(ctype, instance);
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
      device.removeListener('onState', onState);
      done();
    });
  });
};
