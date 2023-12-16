import axios, {AxiosError} from 'axios';
import {NodeServiceType} from './types';

export const Api: {[key: string]: any} = {
  // https://yandex.ru/dev/id/doc/ru/user-information
  login: async (token: string) => {
    return new Promise(async (resolve, reject) => {
      const _options = {
        method: 'GET',
        timeout: 1500,
        url: `https://login.yandex.ru/info`,
        headers: {
          Authorization: `OAuth ${token}`
        }
      };

      try {
        const response = await axios.request(_options);
        resolve(response.data);
      } catch (error: any) {
        let msg = `${error.response.status} - ${error.response.statusText}`;
        if (error.response?.data && typeof error.response?.data === 'object') {
          msg = `${error.response.data.error_code} - ${error.response.data.error_message}`;
        }
        reject(msg);
      }
    });
  },
  // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-state.html
  callback_state: (service: NodeServiceType, device: any) => {
    const credentials: any = service.credentials;

    return new Promise(async (resolve, reject) => {
      const _options = {
        method: 'POST',
        timeout: 1500,
        url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/state`,
        headers: {
          'content-type': 'application/json',
          Authorization: `OAuth ${credentials.oauth_token}`
        },
        data: {
          ts: Math.floor(Date.now() / 1000),
          payload: {
            user_id: service.id,
            devices: [device]
          }
        }
      };

      try {
        const response = await axios.request(_options);
        resolve(response.data);
      } catch (error: any) {
        let msg = `${error.response.status} - ${error.response.statusText}`;
        if (error.response?.data && typeof error.response?.data === 'object') {
          msg = `${error.response.data.error_code} - ${error.response.data.error_message}`;
        }
        reject(msg);
      }
    });
  },
  // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-discovery.html
  callback_discovery: (service: NodeServiceType) => {
    const credentials: any = service.credentials;

    return new Promise(async (resolve, reject) => {
      const _options = {
        method: 'POST',
        timeout: 1500,
        url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/discovery`,
        headers: {
          'content-type': 'application/json',
          Authorization: `OAuth ${credentials.oauth_token}`
        },
        data: {
          ts: Math.floor(Date.now() / 1000),
          payload: {
            user_id: service.id
          }
        }
      };

      try {
        const response = await axios.request(_options);
        resolve(response.data);
      } catch (error: any) {
        let msg = `${error.response.status} - ${error.response.statusText}`;
        if (error.response?.data && typeof error.response?.data === 'object') {
          msg = `${error.response.data.error_code} - ${error.response.data.error_message}`;
        }
        reject(msg);
      }
    });
  }
};
