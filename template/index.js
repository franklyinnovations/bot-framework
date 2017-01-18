var Botler = require('botler');
var Request = require('request-promise');
var fs = require('fs');
var path = require('path');

global.messageType  = Botler.MessageTypes;

const theBot = new Botler.default();
global.bot = theBot;
global.request = Request;
global.addGreeting = theBot.addGreeting.bind(theBot);
global.newScript = theBot.newScript.bind(theBot);
global.getScript = theBot.getScript.bind(theBot);

// theBot.turnOnDebug();

function extension(element) {
  var extName = path.extname(element);
  return extName === '.js'; 
};
var listing = fs.readdirSync('./scripts');
listing
  .filter(extension)
  .map(file => './scripts/'+file)
  .forEach(file => {
    require(file);
  });

var shellInput = new Botler.Platforms.Console(bot);
var web = new Botler.Platforms.Web(bot);

bot.addPlatform(shellInput);
bot.addPlatform(web);

bot.start();

