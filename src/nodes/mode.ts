import {NodeAPI} from 'node-red';
import {NodeDeviceType} from '../lib/types';
import {Status} from '../lib/status';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-mode', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const device = RED.nodes.getNode(config.device) as NodeDeviceType;
    const ctype = 'devices.capabilities.mode';
    const retrievable = true;
    const reportable = config.response; // reportable = response
    const instance = config.instance;
    const modes = config.modes;

    // helpers
    self.statusHelper = new Status(self);

    if (modes.length < 1) {
      const error = 'In the list of supported commands, there must be at least one command';
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
    const keyCache = `${self.id}-${ctype}-${instance}`;
    let value = device.cache.get(keyCache) || String(modes[0]);

    // init
    try {
      self.statusHelper.clear();

      const _modes: any = [];
      modes.forEach((v: any) => {
        _modes.push({value: v});
      });

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
            modes: _modes
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
      if (typeof msg.payload !== 'string') {
        self.statusHelper.set(
          {
            fill: 'red',
            shape: 'dot',
            text: 'Wrong type! msg.payload must be string'
          },
          3000
        );
        return;
      }
      if (!modes.includes(msg.payload)) {
        self.statusHelper.set(
          {
            fill: 'red',
            shape: 'dot',
            text: 'Unsupported command, msg.payload must be from the list of allowed modes'
          },
          3000
        );
        return;
      }
      const payload: string = String(msg.payload);

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
