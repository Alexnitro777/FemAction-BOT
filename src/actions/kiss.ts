import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'поцеловать',
  description: 'Поцеловать пользователя',
  template: '{author} нежно поцеловал(а) {target}.',
  requireTarget: true,
  color: 0xff5e8a,
};

export default action;
