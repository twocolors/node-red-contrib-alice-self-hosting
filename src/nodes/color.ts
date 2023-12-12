import {NodeAPI} from 'node-red';
import {inspect} from 'util';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-color', function (this: any, config: any) {
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const name = config.name;
    const device = RED.nodes.getNode(config.device) as any;
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

    if (!color_support && !temperature_k && color_scene.length < 1) {
      const text = `Error on create capability: At least one parameter must be enabled`;
      self.error(text);
      setStatus({fill: 'red', shape: 'dot', text: text}, 5000);
      return;
    }

    // device not init
    if (!device) return;
    // init
    let instance: any;
    let parameters: any = {};
    let initValue: any;
    if (color_support) {
      instance = scheme;
      parameters.color_model = scheme;
      initValue = scheme == 'hsv' ? {h: 0, s: 0, v: 0} : Number(0.0);
    }
    if (temperature_k) {
      instance = 'temperature_k';
      parameters.temperature_k = {
        min: temperature_min,
        max: temperature_max
      };
      initValue = Number(4500);
    }
    if (color_scene.length > 0) {
      instance = 'scene';
      let scenes: any = [];
      color_scene.forEach((s: any) => {
        scenes.push({id: s});
      });
      parameters.color_scene = {
        scenes: scenes
      };
      initValue = 'alice';
    }

    let value = device.storage[`${ctype}-${instance}`] || initValue;

    // init
    try {
      setStatus({});

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
