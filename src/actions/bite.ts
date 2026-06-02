import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'кусь',
  textName: 'кусь',
  aliases: ['bite'],
  description: 'Укусить пользователя',
  template: '{author} кусьнул(а) {target}.',
  selfTemplate: '{author} кусает себя за хвост.',
  requireTarget: false,
  color: 0xc94b8a,
};

export default action;
