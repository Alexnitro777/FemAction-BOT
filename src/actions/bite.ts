import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'кусь',
  description: 'Укусить няшку',
  template: '{author} куснул {target}.',
  requireTarget: true,
  color: 0xc94b8a,
};

export default action;
