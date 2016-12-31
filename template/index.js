var Botler = require('botler').default;
global.bot = new Botler();

require('./bot');

bot.addPlatform()
bot.start();
