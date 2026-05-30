import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'boop',
  textName: 'буп',
  aliases: ['boop'],
  description: 'Бупнуть пользователя в нос',
  template: '{author} бупнул(а) {target} в носик 👉👃',
  selfTemplate: '{author} бупает воздух... но никого нет рядом 👉',
  requireTarget: false,
  color: 0xffc24b,
  gifs: [
    'https://media.tenor.com/example-boop-1.gif',
    'https://media.tenor.com/example-boop-2.gif',
  ],
};

export default action;
