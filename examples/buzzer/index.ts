import Botler, { User, Intent, defaultReducer, TopicCollection } from 'botler';
import * as rp from 'request-promise';
import * as _ from 'lodash';
import * as util from 'util';

const nlpFiles: Array<string|TopicCollection> = [`${__dirname}/../nlp`];
const bot = new Botler();
// bot.turnOnDebug();

// add skills to bot, skills are run all at once, but prioritized first to last
bot.unshiftSkill(confusedSkill)
  .unshiftSkill(chatSkill)
  .setReducer(newReducer);

function newsSkill(newsInfo: ExtractedNews) {
  return function (user: User): Promise<User> {
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

function confusedSkill(user: User): Promise<User> {
  // console.log(`I'm confused, user intent was ${user.intent.action}`);
  return sendToUser('I\'m confused')
    .then(() => user);
}

function newReducer(intents: Array<Intent>): Promise<Intent> {
  if (this && this.debugOn) { console.log('intents:', util.inspect(intents, { depth: null })); };

  return defaultReducer(intents);
}

function chatSkill(user: User): Promise<User> {
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
      return null; // return null if skill can't process intent;
  }
}

function sendToUser(text: string): Promise<void> {
  console.log(`<- ${text}`);
  return Promise.resolve();
}

function receiveFromUser(user: User, text: string): Promise<User> {
  console.log(`-> ${text}`);
  return bot.processText(user, text);
}

// begin example
const emptyUser: User = bot.createEmptyUser({ apiUserID: 'custom_info' });

interface ExtractedNews {
  categories: Array<string>;
  tags: Array<string>;
  stories: Array<{
    title: string;
    tags: Array<string>;
    category: string;
  }>;
}

function extractBuzz(url: string): Promise<ExtractedNews> {
  return rp(url)
    .then(JSON.parse)
    .then(json => {
      // console.log(util.inspect(json, {depth:1}));
      const stories = json.big_stories.map(story => {
        const theStory = {
          category: '',
          tags: [],
          title: '',
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

      const categories: Array<string> = _.compact(stories.map(story => story.category)) as Array<string>;
      const tags: Array<string> = _.flatten(stories.map(story => story.tags)) as Array<string>;

      const theNews: ExtractedNews = {
        tags,
        categories,
        stories,
      };
      return theNews;
    });
}

extractBuzz('https://www.buzzfeed.com/api/v2/feeds/news')
  .then(initialNews => {
    // add skill that has current news curried into it
    bot.unshiftSkill(newsSkill(initialNews));

    // retrain classifiers with categories from news page
    const categoryCollection: TopicCollection = {
      actions: initialNews.categories.map(category => ({
        action: category.toLowerCase(),
        phrases: [category]})
      ),
      topic: 'categories',
    };
    console.log(`retraining for ${initialNews.categories.length} categories...`);
    bot.retrainClassifiers(nlpFiles.concat(categoryCollection));

    // ask fot top stories
    return receiveFromUser(emptyUser, 'top stories');
  })
  .then(() => receiveFromUser(emptyUser, 'tell me about politics')); // ask about a category that was pulled in dynamically
