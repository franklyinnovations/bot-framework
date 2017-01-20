'use strict';

const Botler = require('../lib/index');
const Promise = require('bluebird');

describe.only('script', () => {
  const bot = new Botler.default();
  const tester = new Botler.Platforms.TestPlatform(bot);
  bot.addPlatform(tester);
  bot.start();

  bot.newScript()
    .dialog((incoming, response) => {
      response.sendText('hi');
    });

  it('hi', function () {
    return tester.newTest()
      .expectText('hi')
      .run();
  });

  it('should fail', function () {
    return tester.newTest()
      .expectText('hey')
      .run();
  });
});
