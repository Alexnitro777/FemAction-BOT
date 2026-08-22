import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'буп',
  description: 'Бупнуть няшку в носик',
  template: '{author} бупнул {target} в носик.',
  requireTarget: true,
  color: 0xffc24b,
};

export default action;
