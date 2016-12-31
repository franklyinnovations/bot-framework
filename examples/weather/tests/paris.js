/*  GLOBALS
  * setUser(object)
  * randomNumber()
  * sendText('string')
  * expectText('string')
  * expectText(['string1', 'string2'])
  * expectQuickReplies(['string1', 'string2'])
*/

setUser({
  id: 'test-paris1',
});
sendText('hi');
expectText('I can tell you the weather in any city.');
sendText('paris');
expectText('The weather in Paris is 78F');