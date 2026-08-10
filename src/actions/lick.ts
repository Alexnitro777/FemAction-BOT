import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'лизнуть',
  description: 'Лизнуть пользователя',
  template: '{author} игриво лизнул(а) {target}.',
  requireTarget: true,
  color: 0xba68c8,
};

export default action;
