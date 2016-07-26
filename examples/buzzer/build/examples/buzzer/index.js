"use strict";
const botler_1 = require('botler');
const rp = require('request-promise');
const _ = require('lodash');
const util = require('util');
const nlpFiles = [`${__dirname}/../nlp`];
const bot = new botler_1.default();
bot.turnOnDebug();
bot.unshiftSkill(confusedSkill)
    .unshiftSkill(chatSkill)
    .setReducer(newReducer);
function newsSkill(newsInfo) {
    return function (user) {
        if (user.intent.action === 'news') {
            return sendToUser(`top stories now:`)
                .then(() => Promise.all(newsInfo.stories.map(story => sendToUser(story.title))))
                .then(() => user);
        }
        if (user.intent.topic === 'categories') {
            return sendToUser(`stories about ${user.intent.action}:`)
                .then(() => Promise.all(newsInfo.stories.filter(story => story.category.toLowerCase() === user.intent.action).map(story => sendToUser(story.title))))
                .then(() => user);
        }
        return null;
    };
}
function confusedSkill(user) {
    return sendToUser('I\'m confused')
        .then(() => user);
}
function newReducer(intents) {
    if (this && this.debugOn)
        console.log('intents:', util.inspect(intents, { depth: null }));
    return botler_1.defaultReducer(intents);
}
function chatSkill(user) {
    switch (user.intent.action) {
        case 'hello':
            user.state = 'hello';
            return sendToUser('Hi there! ')
                .then(() => user);
        case 'help':
            user.state = 'help';
            return sendToUser('Help is on the way!')
                .then(() => user);
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
function extractBuzz(url) {
    return rp(url)
        .then(JSON.parse)
        .then(json => {
        const stories = json.big_stories.map(story => {
            const theStory = {
                title: '',
                tags: [],
                category: '',
            };
            if (!story.title) {
                return null;
            }
            theStory.title = story.title;
            if (story.tags) {
                theStory.tags = story.tags.filter(tag => !tag.startsWith('--'));
            }
            if (story.category) {
                theStory.category = story.category;
            }
            return theStory;
        });
        const categories = _.compact(stories.map(story => story.category));
        const tags = _.flatten(stories.map(story => story.tags));
        return {
            tags,
            categories,
            stories,
        };
    });
}
extractBuzz('https://www.buzzfeed.com/api/v2/feeds/news')
    .then(initialNews => {
    bot.unshiftSkill(newsSkill(initialNews));
    const categoryCollection = {
        topic: 'categories',
        actions: initialNews.categories.map(category => ({
            action: category.toLowerCase(),
            phrases: [category] })),
    };
    bot.retrainClassifiers(nlpFiles.concat(categoryCollection));
    return receiveFromUser(emptyUser, 'top stories');
})
    .then(() => receiveFromUser(emptyUser, 'tell me about politics'));
