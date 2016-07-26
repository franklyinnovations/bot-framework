"use strict";
const botler_1 = require('botler');
const rp = require('request-promise');
const _ = require('lodash');
const util = require('util');
const nlpFiles = [`${__dirname}/../nlp`];
const bot = new botler_1.default();
// bot.turnOnDebug();
//add skills to bot, skills are run all at once, but prioritized first to last
bot.unshiftSkill(confusedSkill)
    .unshiftSkill(chatSkill)
    .setReducer(newReducer);
function newsSkill(newsInfo) {
    return function (user) {
        if (user.intent.action === 'news') {
            return sendToUser(`top stories now:`)
                .then(() => Promise.all(newsInfo.stories.slice(0, 3).map(story => sendToUser(story.title))))
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
    // console.log(`I'm confused, user intent was ${user.intent.action}`);
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
// begin example
const emptyUser = bot.createEmptyUser({ apiUserID: 'custom_info' });
function extractBuzz(url) {
    return rp(url)
        .then(JSON.parse)
        .then(json => {
        // console.log(util.inspect(json, {depth:1}));
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
            tags: tags,
            categories: categories,
            stories: stories,
        };
    });
}
extractBuzz('https://www.buzzfeed.com/api/v2/feeds/news')
    .then(initialNews => {
    //add skill that has current news curried into it
    bot.unshiftSkill(newsSkill(initialNews));
    //retrain classifiers with categories from news page
    const categoryCollection = {
        topic: 'categories',
        actions: initialNews.categories.map(category => ({
            action: category.toLowerCase(),
            phrases: [category] })),
    };
    console.log(`retraining for ${initialNews.categories.length} categories...`);
    bot.retrainClassifiers(nlpFiles.concat(categoryCollection));
    //ask fot top stories
    return receiveFromUser(emptyUser, 'top stories');
})
    .then(() => receiveFromUser(emptyUser, 'tell me about politics')); //ask about a category that was pulled in dynamically
