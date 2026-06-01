import type { ActionDefinition } from '../types.js';

const action: ActionDefinition = {
  name: 'лизнуть',
  textName: 'лизнуть',
  aliases: ['lick'],
  description: 'Лизнуть пользователя',
  template: '{author} игриво лизнул(а) {target}.',
  selfTemplate: '{author} облизывает себе лапку.',
  requireTarget: false,
  color: 0xba68c8,
};

export default action;
