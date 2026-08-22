import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'почесать',
  description: 'Почесать животик няшки',
  template: '{author} чешет животик {target}.',
  requireTarget: true,
  color: 0xeba0ac,
};

export default action;
