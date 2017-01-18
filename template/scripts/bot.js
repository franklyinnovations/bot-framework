/* 
  *** Globals ***
  * addGreeting((user, response) => Promise<void>)
  * newScript(name: string)
*/

addGreeting(function(user, response) {
  response.sendText('Welome. Since this is your first time... let me say a few words.');
});

newScript()
  .begin((incoming, response, stop) => {
    response.sendText('Why don\'t you try asking me about somehing?');
    stop();
  })
  .addDialog((incoming, response, stop) => {
    response.sendText('I am confused and don\'t know what to do');
    stop();
  });