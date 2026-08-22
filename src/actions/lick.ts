import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'лизнуть',
  description: 'Лизнуть няшку',
  template: '{author} игриво лизнул {target}.',
  requireTarget: true,
  color: 0xba68c8,
};

export default action;
