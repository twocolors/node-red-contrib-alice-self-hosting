import axios from 'axios';
import {StorageUserType} from './types';

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
      } catch (error) {
        reject(error);
      }
    });
  },
  // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-state.html
  callback_state: async (skill_id: string, user: StorageUserType, device: any) => {
    return new Promise(async (resolve, reject) => {
      const _options = {
        method: 'POST',
        timeout: 1500,
        url: `https://dialogs.yandex.net/api/v1/skills/${skill_id}/callback/state`,
        headers: {
          'content-type': 'application/json',
          Authorization: `OAuth ${user.token}`
        },
        data: {
          ts: Math.floor(Date.now() / 1000),
          payload: {
            user_id: `${user.login}-${user.id}`,
            devices: [device]
          }
        }
      };

      try {
        const response = await axios.request(_options);
        resolve(response.data);
      } catch (error) {
        reject(error);
      }
    });
  },
  // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-discovery.html
  callback_discovery: async (skill_id: string, user: StorageUserType) => {
    return new Promise(async (resolve, reject) => {
      const _options = {
        method: 'POST',
        timeout: 1500,
        url: `https://dialogs.yandex.net/api/v1/skills/${skill_id}/callback/discovery`,
        headers: {
          'content-type': 'application/json',
          Authorization: `OAuth ${user.token}`
        },
        data: {
          ts: Math.floor(Date.now() / 1000),
          payload: {
            user_id: `${user.login}-${user.id}`
          }
        }
      };

      try {
        const response = await axios.request(_options);
        resolve(response.data);
      } catch (error) {
        reject(error);
      }
    });
  }
};
