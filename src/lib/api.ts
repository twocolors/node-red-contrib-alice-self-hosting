import axios, {AxiosError} from 'axios';
import {NodeServiceType} from './types';
import {inspect} from 'util';
import axiosRetry, {isRetryableError} from 'axios-retry';

const version: string = require('../../package.json').version.trim();
const name: string = require('../../package.json').name.trim();

export const Api: {[key: string]: any} = {
  // https://yandex.ru/dev/id/doc/ru/user-information
  login: async (token: string) => {
    axiosRetry(axios, {
      retries: 3,
      retryDelay: retryCount => retryCount * 75,
      retryCondition: isRetryableError,
      shouldResetTimeout: true
    });

    const _options = {
      method: 'GET',
      timeout: 300,
      url: `https://login.yandex.ru/info`,
      headers: {
        Authorization: `OAuth ${token}`,
        'User-Agent': `${name}/${version} Node-RED`
      }
    };

    try {
      return await axios.request(_options);
    } catch (e: any) {
      const error = e as AxiosError;
      let msg = `${error.response?.status} - ${error.message}`;
      if (error.response?.data && typeof error.response?.data === 'object') {
        msg = `${error.response?.status} - ${inspect(error.response?.data)}`;
      }
      throw new Error(msg);
    }
  },
  // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-state.html
  callback_state: async (service: NodeServiceType, device: any) => {
    const credentials: any = service.credentials;
    const ts: number = Date.now() / 1000;

    axiosRetry(axios, {
      retries: 10,
      retryDelay: retryCount => retryCount * 75,
      retryCondition: isRetryableError,
      shouldResetTimeout: true
    });

    const _options = {
      method: 'POST',
      timeout: 750,
      url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/state`,
      headers: {
        Authorization: `OAuth ${credentials.oauth_token}`,
        'User-Agent': `${name}/${version} Node-RED`,
        'Content-Type': `application/json`
      },
      data: {
        ts: ts,
        payload: {
          user_id: service.id,
          devices: [device]
        }
      }
    };

    try {
      return await axios.request(_options);
    } catch (e: any) {
      const error = e as AxiosError;
      let msg = `${error.response?.status} - ${error.message}`;
      if (error.response?.data && typeof error.response?.data === 'object') {
        msg = `${error.response?.status} - ${inspect(error.response?.data)}`;
      }
      throw new Error(msg);
    }
  },
  // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-discovery.html
  callback_discovery: (service: NodeServiceType) => {
    const credentials: any = service.credentials;
    const ts: number = Date.now() / 1000;

    axiosRetry(axios, {
      retries: 10,
      retryDelay: retryCount => retryCount * 75,
      retryCondition: isRetryableError,
      shouldResetTimeout: true
    });

    const _options = {
      method: 'POST',
      timeout: 750,
      url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/discovery`,
      headers: {
        Authorization: `OAuth ${credentials.oauth_token}`,
        'User-Agent': `${name}/${version} Node-RED`,
        'Content-Type': `application/json`
      },
      data: {
        ts: ts,
        payload: {
          user_id: service.id
        }
      }
    };

    return axios.request(_options).catch((error: AxiosError) => {
      let msg = `${error.response?.status} - ${error.message}`;
      if (error.response?.data && typeof error.response?.data === 'object') {
        msg = `${error.response?.status} - ${inspect(error.response?.data)}`;
      }
      throw new Error(msg);
    });
  }
};
