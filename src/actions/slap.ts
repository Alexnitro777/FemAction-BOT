import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'шлепнуть',
  description: 'Шлёпнуть пользователя',
  template: '{author} звонко шлёпнул(а) {target}!',
  requireTarget: true,
  color: 0xff7043,
};

export default action;
