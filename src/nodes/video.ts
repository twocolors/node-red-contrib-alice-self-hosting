import {NodeAPI} from 'node-red';
import {NodeDeviceType} from '../lib/types';
import {Status} from '../lib/status';

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType('alice-sh-video', function (this: any, config: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.config = config;

    RED.nodes.createNode(this, config);

    // var
    const device = RED.nodes.getNode(config.device) as NodeDeviceType;
    const ctype = 'devices.capabilities.video_stream';
    const instance = 'get_stream';
    const stream_url = config.stream_url;
    const protocol = config.protocol;
    const retrievable = false;
    const reportable = false; // reportable = response

    // helpers
    self.statusHelper = new Status(self);

    // device not init
    if (!device || !device.init) return;

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
            value: {
              stream_url: stream_url,
              protocol: protocol
            }
          },
          parameters: {
            instance: instance,
            protocols: [protocol]
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

    self.on('close', async (removed: boolean, done: any) => {
      device.removeCapability(ctype, instance);
      if (removed) {
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
