var Botler = require('botler').default;
var bot = new Botler([__dirname+'/nlp']);

function chatSkill(user) {
  switch(user.intent.action) {
    case 'random':
      return sendTextToUser(user, 'That\'s random');
    default:
      return sendTextToUser(user, 'huh?!');
  }
}
bot.unshiftSkill(chatSkill);

function sendTextToUser(user, text) {
  console.log(`<- ${text}`);
  return Promise.resolve(user);
}

function receiveTextFromUser(user, text) {
  console.log(`-> ${text}`);
  return bot.processText(user, text);
}

function conversationStartedByNewUser(text) {
  return receiveTextFromUser(bot.createEmptyUser(), text);
}

//replace with calls from an endpoint
conversationStartedByNewUser('random');
