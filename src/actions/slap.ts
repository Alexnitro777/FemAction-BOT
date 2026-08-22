import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'шлепнуть',
  description: 'Шлёпнуть няшку',
  template: '{author} звонко шлёпнул {target}!',
  requireTarget: true,
  color: 0xff7043,
};

export default action;
