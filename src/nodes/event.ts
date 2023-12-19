import {NodeAPI} from 'node-red';
import {NodeDeviceType} from '../lib/types';
import {Status} from '../lib/status';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-event', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const device = RED.nodes.getNode(config.device) as NodeDeviceType;
    const ptype = 'devices.properties.event';
    const instance = config.instance;
    const retrievable = true;
    const reportable = true; // reportable = response
    const events = config.events;

    // helpers
    self.statusHelper = new Status(self);

    // device not init
    if (!device) return;
    // init
    const keyCache = `${self.id}-${ptype}-${instance}`;
    let value = device.cache.get(keyCache) || undefined;

    // init
    try {
      self.statusHelper.clear();

      const _events: any = [];
      events.forEach((v: any) => {
        _events.push({value: v});
      });

      device.setProperty(
        {
          type: ptype,
          reportable: reportable,
          retrievable: retrievable,
          parameters: {
            instance: instance,
            events: _events
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

    self.on('input', async (msg: any) => {
      const payload: any = msg.payload;
      if (!events.includes(payload)) {
        self.statusHelper.set(
          {
            fill: 'red',
            shape: 'dot',
            text: 'Unsupported events, msg.payload must be from the list of allowed events'
          },
          3000
        );
        return;
      }

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
