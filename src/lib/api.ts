import axios, {AxiosError} from 'axios';
import {NodeServiceType} from './types';
import {inspect} from 'util';
import axiosRetry, {isRetryableError} from 'axios-retry';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Package: any = require('../../package.json');

// if someone will be read this code
// I say: "Yandex sorry for axiosRetry"
// i know, i fix 5xx from response (Yandex),
// but make more 5xx for other ...

const userAgent = `${Package.name.trim()}/${Package.version.trim()} Node-RED`;

const _error = function (error: AxiosError) {
  let text = `${error.response?.status} - ${error.message}`;
  if (error.response?.data && typeof error.response?.data === 'object') {
    text = `${error.response?.status} - ${inspect(error.response?.data)}`;
  }
  return text;
};

export const Api: {[key: string]: any} = {
  // https://yandex.ru/dev/id/doc/ru/user-information
  login: async (token: string) => {
    axiosRetry(axios, {
      retries: 3,
      retryDelay: retryCount => retryCount * 150,
      retryCondition: isRetryableError
    });

    const _options = {
      method: 'GET',
      url: 'https://login.yandex.ru/info',
      headers: {
        Authorization: `OAuth ${token}`,
        'User-Agent': userAgent
      }
    };

    try {
      return await axios.request(_options);
    } catch (error: any) {
      throw new Error(_error(error));
    }
  },
  // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-state.html
  callback_state: async (service: NodeServiceType, device: any) => {
    const credentials: any = service.credentials;
    const ts: number = Date.now() / 1000;

    axiosRetry(axios, {
      retries: 8,
      retryDelay: retryCount => retryCount * 200,
      retryCondition: isRetryableError
    });

    const _options = {
      method: 'POST',
      url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/state`,
      headers: {
        Authorization: `OAuth ${credentials.oauth_token}`,
        'User-Agent': userAgent,
        'Content-Type': 'application/json'
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
    } catch (error: any) {
      throw new Error(_error(error));
    }
  },
  // https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-discovery.html
  callback_discovery: (service: NodeServiceType) => {
    const credentials: any = service.credentials;
    const ts: number = Date.now() / 1000;

    axiosRetry(axios, {
      retries: 5,
      retryDelay: retryCount => retryCount * 150,
      retryCondition: isRetryableError
    });

    const _options = {
      method: 'POST',
      url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/discovery`,
      headers: {
        Authorization: `OAuth ${credentials.oauth_token}`,
        'User-Agent': userAgent,
        'Content-Type': 'application/json'
      },
      data: {
        ts: ts,
        payload: {
          user_id: service.id
        }
      }
    };

    return axios.request(_options).catch((error: AxiosError) => {
      throw new Error(_error(error));
    });
  }
};
