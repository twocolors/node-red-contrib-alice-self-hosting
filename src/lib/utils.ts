import {env} from 'node:process';

export const Node: {[key: string]: any} = {
  webhook: () => {
    let path = '/QYQaXmunrbGW7KWe/webhook';
    if (env.ALICE_SH_PATH !== undefined) {
      path = env.ALICE_SH_PATH;
    }
    path = '/' + path.replace(/^\/|\/$/g, '') + '/';
    return path;
  },
  version: require('../../package.json').version.trim(),
} as const;
