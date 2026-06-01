import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'шлепнуть',
  textName: 'шлепнуть',
  aliases: ['slap'],
  description: 'Шлёпнуть пользователя',
  template: '{author} звонко шлёпнул(а) {target}!',
  selfTemplate: '{author} шлёпает воздух, промахнувшись по цели.',
  requireTarget: false,
  color: 0xff7043,
};

export default action;
