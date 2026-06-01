import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'hug',
  textName: 'обнять',
  aliases: ['hug'],
  description: 'Обнять пользователя',
  template: '{author} крепко обнял(а) {target}.',
  selfTemplate: '{author} обнимает сам(а) себя.',
  requireTarget: false,
  color: 0x7ec8e3,
};

export default action;
