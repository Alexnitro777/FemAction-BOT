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
  gifs: [
    'https://media.tenor.com/example-hug-1.gif',
    'https://media.tenor.com/example-hug-2.gif',
  ],
};

export default action;
