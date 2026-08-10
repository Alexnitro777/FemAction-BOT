import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'почесать',
  description: 'Почесать пользователя за ушком.',
  template: '{author} чешет за ушком {target}.',
  requireTarget: true,
  color: 0xeba0ac,
};

export default action;
