import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'silly',
  textName: 'силли',
  aliases: ['silly'],
  description: 'Назвать пользователя силли',
  template: '{author} считает, что {target} — силли 🤪',
  selfTemplate: '{author} сегодня сам(а) немного силли 🤪',
  requireTarget: false,
  color: 0xcba6f7,
  gifs: [
    'https://media.tenor.com/example-silly-1.gif',
    'https://media.tenor.com/example-silly-2.gif',
  ],
};

export default action;
