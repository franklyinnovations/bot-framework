"use strict";
const botler_1 = require('botler');
const util = require('util');
const bot = new botler_1.default([`${__dirname}/../nlp`]);
bot.unshiftSkill(confusedSkill)
    .unshiftSkill(chatSkill)
    .unshiftSkill(weatherSkill)
    .setReducer(weatherReducer);
function weatherSkill(user) {
    const weather = ['sunny', 'rainy', 'cloudy'];
    if (user.intent.topic === 'location') {
        const city = user.intent.action.replace('_', ' ');
        user.state = 'none';
        return sendToUser(`the weather in ${city} will be ${weather[Math.floor(Math.random() * weather.length)]}`)
            .then(() => user);
    }
    if (user.intent.topic === 'details' && user.intent.details.value.toString().length === 5) {
        const zip = user.intent.details.value;
        user.state = 'none';
        return sendToUser(`the weather at ${zip} will be ${weather[Math.floor(Math.random() * weather.length)]}`)
            .then(() => user);
    }
    return null;
}
function confusedSkill(user) {
    return sendToUser('I\'m confused')
        .then(() => user);
}
function weatherReducer(intents) {
    if (this && this.debugOn)
        console.log('intents:', util.inspect(intents, { depth: null }));
    const location = intents.filter(intent => intent.topic === 'location');
    if (location.length > 0) {
        return Promise.resolve(location[0]);
    }
    return botler_1.defaultReducer(intents);
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
            return null;
        case 'no':
            if (user.state === 'hello') {
                user.state = 'none';
                return sendToUser('Why not?')
                    .then(() => user);
            }
            return null;
        default:
            return null;
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
const emptyUser = bot.createEmptyUser({ apiUserID: 'custom_info' });
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
    return receiveFromUser(user, 'What\'s the weather in New York, NY tomorrow');
})
    .then((user) => {
    return receiveFromUser(user, 'How about at 10004');
});
