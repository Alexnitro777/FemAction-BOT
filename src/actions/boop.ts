import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'буп',
  textName: 'буп',
  aliases: ['boop'],
  description: 'Бупнуть пользователя в носик.',
  template: '{author} бупнул(а) {target} в носик.',
  selfTemplate: '{author} бупает воздух... никого нет рядом.',
  requireTarget: false,
  color: 0xffc24b,
};

export default action;
