import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'кусь',
  description: 'Укусить пользователя',
  template: '{author} кусьнул(а) {target}.',
  requireTarget: true,
  color: 0xc94b8a,
};

export default action;
