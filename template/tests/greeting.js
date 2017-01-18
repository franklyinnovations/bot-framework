describe('greeting', function() {
  it('first-run', function() {
    const prom = newTest()
      .expectTextResponse('Welome. Since this is your first time... let me say a few words.')
      .expectTextResponse('Why don\'t you try asking me about somehing?')
      .run()
    return prom;
  });
});
