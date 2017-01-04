var Botler = require('botler');
var Request = require('requuest-promuise');
global.bot = new Botler.default();
global.request = Request;
global.addGreeting = global.bot.addGreeting;
global.newScript = global.bot.newScript;
global.getScript = global.bot.getScript;

require('./bot');

var console = new Botler.Platforms.Console(bot);
bot.addPlatform(console);
bot.start();
