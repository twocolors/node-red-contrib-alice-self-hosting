import {NodeAPI} from 'node-red';
import {inspect} from 'util';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-event', function (this: any, config: any) {
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const name = config.name;
    const device = RED.nodes.getNode(config.device) as any;
    const ptype = 'devices.properties.event';
    const instance = config.instance;
    const retrievable = true;
    const reportable = true;
    const events = config.events;

    // helpers
    const clearStatus = (timeout = 0) => {
      setTimeout(() => {
        self.status({});
      }, timeout);
    };

    const setStatus = (status: any, timeout = 0) => {
      self.status(status);
      if (timeout) {
        clearStatus(timeout);
      }
    };

    const _updateStateDevice = async () => {
      try {
        await device.updateStateDevice();
      } catch (error) {
        setStatus({fill: 'red', shape: 'dot', text: error}, 5000);
      }
    };

    const _updateInfoDevice = async () => {
      try {
        await device.updateInfoDevice();
      } catch (error) {
        setStatus({fill: 'red', shape: 'dot', text: error}, 5000);
      }
    };

    // device not init
    if (!device) return;
    // init
    let value = device.storage[`${ptype}-${instance}`] || '';

    // init
    try {
      setStatus({});

      let _events: any = [];
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
      setStatus({
        fill: 'red',
        shape: 'dot',
        text: error
      });
      return;
    }

    _updateInfoDevice();

    self.on('input', async (msg: any, send: () => any, done: () => any) => {
      const payload: any = msg.payload;
      if (value == payload) return;
      value = payload;

      let text = typeof payload !== 'undefined' && typeof payload !== 'object' ? payload : inspect(payload);
      if (text && text.length > 32) {
        text = text.substr(0, 32) + '...';
      }
      setStatus({fill: 'yellow', shape: 'dot', text: text}, 3000);

      device.updateState(payload, ptype, instance);

      await _updateStateDevice();
    });

    self.on('close', async (removed: boolean, done: any) => {
      device.removeProperty(ptype, instance);
      if (removed) {
        device.storage[`${ptype}-${instance}`] = undefined;
        await _updateInfoDevice();
        await _updateStateDevice();
      }
      done();
    });
  });
};
