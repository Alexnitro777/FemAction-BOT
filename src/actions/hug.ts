import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'обнять',
  description: 'Обнять пользователя',
  template: '{author} крепко обнял(а) {target}.',
  requireTarget: true,
  color: 0x7ec8e3,
};

export default action;
