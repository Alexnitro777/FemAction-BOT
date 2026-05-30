import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'bite',
  textName: 'кусь',
  aliases: ['bite'],
  description: 'Кусьнуть пользователя',
  template: '{author} цапнул(а) {target} 😼🦷',
  selfTemplate: '{author} кусает себя за хвост 🦷',
  requireTarget: false,
  color: 0xc94b8a,
  gifs: [
    'https://media.tenor.com/example-bite-1.gif',
    'https://media.tenor.com/example-bite-2.gif',
  ],
};

export default action;
