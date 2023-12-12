import {NodeAPI} from 'node-red';
import {inspect} from 'util';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-mode', function (this: any, config: any) {
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const name = config.name;
    const device = RED.nodes.getNode(config.device) as any;
    const ctype = 'devices.capabilities.mode';
    const retrievable = true;
    const reportable = config.response; // reportable = response
    const instance = config.instance;
    const modes = config.modes;

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

    if (modes.length < 1) {
      const text = `In the list of supported commands, there must be at least one command`;
      self.error(text);
      setStatus({fill: 'red', shape: 'dot', text: text}, 5000);
      return;
    }

    // device not init
    if (!device) return;
    // init
    let value = device.storage[`${ctype}-${instance}`] || String('auto');

    // init
    try {
      setStatus({});

      let _modes: any = [];
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

      device.updateState(payload, ctype, instance);

      await _updateStateDevice();
    });

    const onState = (object: any) => {
      if (object?.type == ctype && object?.state?.instance == instance) {
        value = object?.state?.value;

        device.updateState(value, ctype, instance);

        self.send({
          payload: value,
          type: object?.type,
          instance: object?.state?.instance
        });

        if (reportable) {
          _updateStateDevice();
        }
      }
    };

    device.on('onState', onState);

    self.on('close', async (removed: boolean, done: any) => {
      device.removeCapability(ctype, instance);
      if (removed) {
        device.storage[`${ctype}-${instance}`] = undefined;
        await _updateInfoDevice();
        await _updateStateDevice();
      }
      device.removeListener('onState', onState);
      done();
    });
  });
};
