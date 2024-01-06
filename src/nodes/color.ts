import {NodeAPI} from 'node-red';
import {NodeDeviceType} from '../lib/types';
import {Status} from '../lib/status';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-color', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const device = RED.nodes.getNode(config.device) as NodeDeviceType;
    const ctype = 'devices.capabilities.color_setting';
    const retrievable = true;
    const reportable = config.response; // reportable = response
    const color_support = config.color_support;
    const scheme = config.scheme;
    const temperature_k = config.temperature_k;
    const temperature_min = parseInt(config.temperature_min);
    const temperature_max = parseInt(config.temperature_max);
    const color_scene = config.color_scene || [];

    // helpers
    self.statusHelper = new Status(self);

    if (!color_support && !temperature_k && color_scene.length < 1) {
      const error = 'Least one parameter must be enabled';
      self.error(error);
      self.statusHelper.set({
        fill: 'red',
        shape: 'dot',
        text: error
      });
      return;
    }

    // device not init
    if (!device) return;
    // init
    let instance: any;
    const parameters: any = {};
    let value: any;
    if (color_support) {
      instance = scheme;
      parameters.color_model = scheme;
      value = scheme == 'hsv' ? {h: 0, s: 0, v: 0} : Number(0.0);
    }
    if (temperature_k) {
      instance = 'temperature_k';
      parameters.temperature_k = {
        min: temperature_min,
        max: temperature_max
      };
      value = Number(4500);
    }
    if (color_scene.length > 0) {
      instance = 'scene';
      const scenes: any = [];
      color_scene.forEach((s: any) => {
        scenes.push({id: s});
      });
      parameters.color_scene = {
        scenes: scenes
      };
      value = color_scene[0];
    }

    const keyCache = `${self.id}-${ctype}-${instance}`;
    value = device.cache.get(keyCache) || value;

    // init
    try {
      self.statusHelper.clear();

      device.setCapability(
        {
          type: ctype,
          reportable: reportable,
          retrievable: retrievable,
          state: {
            instance: instance,
            value: value
          },
          parameters
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
      if (typeof msg.payload !== 'object' && typeof msg.payload !== 'number' && typeof msg.payload !== 'string') {
        self.statusHelper.set(
          {
            fill: 'red',
            shape: 'dot',
            text: 'Wrong type! msg.payload type is unsupported'
          },
          3000
        );
        return;
      }
      const payload: any = msg.payload;

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
        value = object?.state?.value;

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
