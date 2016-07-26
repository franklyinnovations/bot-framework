"use strict";
const botler_1 = require('botler');
const botler_2 = require('botler');
const bot = new botler_1.default([`${__dirname}/../nlp`]);
// bot.turnOnDebug();
function weatherSkill(user) {
    if (user.intent.topic === 'location') {
        const city = user.intent.action.replace('_', ' ');
        user.state = 'none';
        const weather = ['sunny', 'rainy', 'cloudy'];
        return sendToUser(`the weather in ${city} will be ${weather[Math.floor(Math.random() * weather.length)]}`)
            .then(() => user);
    }
    return null; //return null if skill can't process intent;
}
function confusedSkill(user) {
    // console.log(`I'm confused, user intent was ${user.intent.action}`);
    return sendToUser('I\'m confused')
        .then(() => user);
}
function weatherReducer(intents) {
    // console.log('intents:', intents);
    return botler_2.defaultReducer(intents);
}
function chatSkill(user) {
    switch (user.intent.action) {
        case 'hello':
            user.state = 'hello';
            return sendToUser('Hi there! Would you like to know the weather?')
                .then(() => user);
        case 'help':
            user.state = 'help';
            return sendToUser('Hi there! just tell me what city you want to know the weather in...')
                .then(() => user);
        case 'weather':
            user.state = 'location';
            return sendToUser('What city do you want to know the weather in?')
                .then(() => user);
        case 'yes':
            if (user.state === 'hello') {
                user.state = 'city';
                return sendToUser('Great, what city?')
                    .then(() => user);
            }
            return null; //return null if skill can't process intent;
        case 'no':
            if (user.state === 'hello') {
                user.state = 'none';
                return sendToUser('Why not?')
                    .then(() => user);
            }
            return null; //return null if skill can't process intent;
        default:
            return null; //return null if skill can't process intent;
    }
}
function sendToUser(text) {
    console.log(`<- ${text}`);
    return Promise.resolve();
}
function receiveFromUser(user, text) {
    console.log(`-> ${text}`);
    return bot.processText(user, text);
}
//add skills to bot, skills are run all at once, but prioritized first to last
bot.unshiftSkill(confusedSkill)
    .unshiftSkill(chatSkill)
    .unshiftSkill(weatherSkill)
    .setReducer(weatherReducer);
// begin example
const emptyUser = {
    state: 'none',
    intent: {
        action: 'none',
        topic: 'none',
    },
};
receiveFromUser(emptyUser, 'hi')
    .then((user) => {
    return receiveFromUser(user, 'yes');
})
    .then((user) => {
    return receiveFromUser(user, 'london');
})
    .then((user) => {
    return receiveFromUser(user, 'help');
})
    .then((user) => {
    return receiveFromUser(user, 'what\'s the weather in London?');
})
    .then((user) => {
    return receiveFromUser(user, 'you\'re the best!');
})
    .then((user) => {
    return receiveFromUser(user, 'What\'s the weather in New York, NY');
});
