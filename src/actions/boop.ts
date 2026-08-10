import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'буп',
  description: 'Бупнуть пользователя в носик.',
  template: '{author} бупнул(а) {target} в носик.',
  requireTarget: true,
  color: 0xffc24b,
};

export default action;
