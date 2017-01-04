/* 
  *** Globals ***
  * bot
  * request
*/

addGreeting(function(user, response) {
  response.sendText('Welome. I\'m a bot, what can I do for you?');
  response.startScript('yo');
});

var aScript = newScript('yo');
aScript.addDialog(function(icoming, response, next) {
  response.sendText('I\'m confused because I\'m just a babybot');
})

newScript()
  .addDialog(function(icoming, response, next) {
    response.sendText('I\'m confused because I\'m just a babybot');
  });