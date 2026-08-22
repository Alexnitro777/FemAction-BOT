import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'шлепнуть',
  description: 'Шлёпнуть няшку',
  template: '{author} звонко шлёпнул {target}!',
  requireTarget: true,
  color: 0xff7043,
  protectedTargets: ['703129488170549258'],
  protectedResponse: {
    text: 'Эту няшку нельзя шлепать!!',
    gif: 'http://77.110.101.28/cdn/other/3frflceGWZ7_.gif',
    color: 0xff7043,
  },
};

export default action;
