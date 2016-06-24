"use strict";
const _1 = require('../../lib/');
const bot = new _1.default([`${__dirname}/../nlp/classifiers.json`]);
function weatherSkill(user) {
    if (user.state === 'city'
        && user.intent.details.places && user.intent.details.places.length > 0) {
        console.log(`the weather in ${user.intent.details.places[0].title} will be sunny`);
        user.state = 'none';
        return Promise.resolve(user);
    }
    if (user.intent.action === 'weather') {
        if (!user.intent.details.places || user.intent.details.places.length === 0) {
            console.log('What city would you like the weather for?');
            user.state = 'city';
            return Promise.resolve(user);
        }
        else {
            // return weatherapi(...).then(()=>user);
            console.log(`the weather in ${user.intent.details.places[0].title} will be sunny`);
            user.state = 'none';
            return Promise.resolve(user);
        }
    }
    return null; //return null if skill can't process intent;
}
function confusedSkill(user) {
    console.log(`I'm confused, user intent was ${user.intent.action}`);
    return Promise.resolve(user);
}
function chatSkill(user) {
    switch (user.intent.action) {
        case 'hello':
            console.log('Hi there! Would you like to know the weather?');
            user.state = 'hello';
            return Promise.resolve(user);
        case 'help':
            console.log('Hi there! just tell me what city you want to know the weather in...');
            user.state = 'help';
            return Promise.resolve(user);
        case 'yes':
            if (user.state === 'hello') {
                console.log('Great, what city?');
                user.state = 'city';
                return Promise.resolve(user);
            }
            return null; //return null if skill can't process intent;
        case 'no':
            if (user.state === 'hello') {
                console.log('Why not?');
                user.state = 'none';
                return Promise.resolve(user);
            }
            return null; //return null if skill can't process intent;
        default:
            return null; //return null if skill can't process intent;
    }
}
//add skills to bot, skills are run all at once, but prioritized first to last
bot.unshiftSkill(confusedSkill);
bot.unshiftSkill(chatSkill);
bot.unshiftSkill(weatherSkill);
const emptyUser = {
    state: 'none',
    intent: {
        action: 'none',
    },
};
console.log('- hi');
bot.processText(emptyUser, 'hi')
    .then((user) => {
    console.log('- yes');
    return bot.processText(user, 'yes');
})
    .then((user) => {
    console.log('- london');
    return bot.processText(user, 'london');
})
    .then((user) => {
    console.log('- help');
    return bot.processText(user, 'help');
})
    .then((user) => {
    console.log('- what\'s the weather in London?');
    return bot.processText(user, 'what\'s the weather in London?');
});
