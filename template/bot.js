/* 
  *** Globals ***
  * bot
*/

bot.addGreeting(function(user, response) {
  response.sendText('Welome. I\'m a bot, what can I do for you?');
});

bot.addScript(function(user, incoming, response, next) {
  response.sendText('I\'m confused because I\'m just a babybot');
});