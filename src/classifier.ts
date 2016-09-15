import * as natural from 'natural';
import * as _ from 'lodash';
import * as util from 'util'; // tslint:disable-line
import * as fs from 'fs';

export interface ActionCollection {
  action: string;
  phrases: Array<string>;
}

export interface TopicCollection {
  topic: string;
  actions: Array<ActionCollection>;
}

export interface ActionClassifier {
  [key: string]: natural.LogisticRegressionClassifier;
}

export interface Classifiers {
  [key: string]: ActionClassifier;
}

export const classifier = natural.LogisticRegressionClassifier;
// export const classifier = natural.BayesClassifier;

export function GenerateClassifier(topicsToLoad: Array<string | TopicCollection>): Classifiers {
  const topics: Array<TopicCollection> = topicsToLoad.filter(element => typeof element !== 'string') as Array<TopicCollection>;
  topicsToLoad.filter(directory => typeof directory === 'string').filter((directory: string) => !_.startsWith(directory, '.')).forEach((directory: string) => fs.readdirSync(directory).filter((directory: string) => !_.startsWith(directory, '.')).forEach(topic => {
    topics.push(readInTopic(topic, `${directory}/${topic}`));
  }));
  // console.log('t:', util.inspect(topics, {depth:null}));
  const topicPhrases = topics.map((topic: TopicCollection) => _.flatten(topic.actions.map(action => action.phrases)));
  const allPhrases: string[] = _.chain(topicPhrases).flatten().flatten().value() as Array<string>;
  // console.log('ap:', util.inspect(allPhrases, {depth:null}));

  const classifiers: Classifiers = {};
  topics.forEach(topic => {
    classifiers[topic.topic] = GenerateTopicClassifier(topic, allPhrases);
  });
  // console.log(classifiers);
  return classifiers;
}

function readInTopic(topic: string, directory: string): TopicCollection {
  // console.log('dir', directory);
  const actions = [];
  fs.readdirSync(directory).filter(file => !_.startsWith(file, '.')).forEach(file => {
    const key = /(.*).json/.exec(file);
    // console.log(`loading '${key[1]}'`);
    try {
      const phrases = require(`${directory}/${file}`);
      actions.push({action: key[1], phrases});
    } catch (err) {
      throw new Error(`Invalid JSON file ${directory}/${file}`);
    }
  });
  return {
    topic,
    actions,
  };
}

export function GenerateTopicClassifier(topic: TopicCollection, allPhrases: Array<string>) {
  const classifiers: { [key: string]: natural.LogisticRegressionClassifier } = {};
  topic.actions.forEach((action: ActionCollection) => { // eslint-disable-line no-unused-vars
    const phrases = action.phrases;
    const key = action.action;

    const thisClassifier = new classifier();
    const otherPhrases = _.difference(allPhrases, phrases);
    // console.log(value);
    phrases.forEach(phrase => thisClassifier.addDocument(phrase, 'true'));
    otherPhrases.forEach(phrase => thisClassifier.addDocument(phrase, 'false'));
    console.log(`training ${key}`);
    thisClassifier.train();

    // console.log(`--${key}--`);
    //
    // const othersChecked = otherPhrases.map(phrase => thisClassifier.classify(phrase)).map((classified, index) => {
    //   if (classified === 'true') {
    //     // console.log('other', index, otherPhrases[index], thisClassifier.getClassifications(otherPhrases[index]));
    //     return otherPhrases[index];
    //   }
    //   return null;
    // });
    //
    // const selfChecked = phrases.map(phrase => thisClassifier.classify(phrase)).map((classified, index) => {
    //   if (classified === 'false') {
    //     // console.log('self', index, value[index], thisClassifier.getClassifications(value[index]));
    //     return phrases[index];
    //   }
    //   // console.log(value[index], thisClassifier.getClassifications(value[index]));
    //   return null;
    // });
    // console.log('other:', otherPhrases.length, '  self:', value.length);
    // console.log('passed for other', _.compact(othersChecked));
    // console.log('failed for home', _.compact(selfChecked));

    classifiers[key] = thisClassifier;
  });

  return classifiers;
}
