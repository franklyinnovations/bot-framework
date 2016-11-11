import * as natural from 'natural';
import * as _ from 'lodash';
import * as util from 'util'; // tslint:disable-line
import * as fs from 'fs';

const CURRENT_CLASSIFIER_VERSION = 1;

export interface ActionCollection {
  action: string;
  phrases: Array<string>;
}

export interface TopicCollection {
  topic: string;
  actions: Array<ActionCollection>;
  location: string;
}

export interface ActionClassifier {
  [key: string]: natural.LogisticRegressionClassifier;
}

export interface Classifiers {
  [key: string]: ActionClassifier;
}

export interface Classification {
  label: string;
  topic: string;
  value: number;
}

interface CacheFile {
  phrases: Array<string>;
  classifiers: {
    [key: string]: any;
  }
  version: number;
}

export type filename = string;

export function onlyDirectories(name: string): boolean {
  return !(_.startsWith(name, '.') || _.endsWith(name, '.json'));
}

export const classifier = natural.LogisticRegressionClassifier;
// export const classifier = natural.BayesClassifier;

export function GenerateClassifier(topicsToLoad: Array<filename | TopicCollection>, cacheFileName?: string): Classifiers {
  const topics: Array<TopicCollection> = topicsToLoad.filter(element => typeof element !== 'string') as Array<TopicCollection>;
  const classifiers: Classifiers = {};

  topicsToLoad
    .filter(directory => typeof directory === 'string')
    .filter((directory: string) => onlyDirectories(directory))
    .forEach((directory: string) => 
      fs.readdirSync(directory)
        .filter((directory: string) => onlyDirectories(directory))
        .forEach(topic => {
          topics.push(readInTopic(topic, `${directory}/${topic}`));
        })
    );
  // console.log('t:', util.inspect(topics, {depth:null}));
  const topicPhrases = topics.map((topic: TopicCollection) => _.flatten(topic.actions.map(action => action.phrases)));
  const allPhrases: string[] = _.chain(topicPhrases).flatten().flatten().value() as Array<string>;
  // console.log('ap:', util.inspect(allPhrases, {depth:null}));

  if (_.isString(cacheFileName)) {
    try {
      const file = fs.readFileSync(cacheFileName, 'utf8');
      const parsed: CacheFile = JSON.parse(file);
      if (parsed.version !== CURRENT_CLASSIFIER_VERSION) {
        throw new Error('Inoccect file version');
      }
      // console.log('parsed');
      // console.log(parsed.phrases);
      // console.log('all');
      // console.log(allPhrases);
      if (_.isEqual(parsed.phrases, allPhrases)) {
        _.forIn(parsed.classifiers, (actions, topic) => {
          // console.log(actions);
          classifiers[topic] = _.mapValues(actions, phrase => classifier.restore(phrase));
        });
        return classifiers;
      } else {
        throw new Error('need to retrain');
      }
    } catch(err) {
      console.log('can\'t load cached file', err);
    }
  }
  
  topics.forEach(topic => {
    if (topic.location === null) {
      classifiers[topic.topic] = GenerateTopicClassifier(topic, allPhrases);
      return;
    }
    const jsonFile = `${topic.location}/../${topic.topic}.json`;
    try {
      const stringed = fs.readFileSync(jsonFile, 'utf8');
      const parsed = JSON.parse(stringed);
      if (!(_.isEqual(topic.actions.map(action => action.action), _.keys(parsed.classifiers)) &&
          _.isEqual(allPhrases, parsed.allPhrases))) {
        console.log(`need to retrain ${topic.topic}`);
        throw new Error();
      }
      const restored = _.mapValues(parsed.classifiers, phrase => classifier.restore(phrase));
      classifiers[topic.topic] = restored;
      console.log(`restored ${topic.topic}`);
    } catch(err) {
      classifiers[topic.topic] = GenerateTopicClassifier(topic, allPhrases);
      const savable = {
        classifiers: classifiers[topic.topic],
        allPhrases: allPhrases,
      };
      fs.writeFileSync(jsonFile, JSON.stringify(savable), 'utf8');
    }
  });

  if (_.isString(cacheFileName)) {
    const classifierModule: CacheFile = {
      phrases: allPhrases,
      classifiers: classifiers,
      version: CURRENT_CLASSIFIER_VERSION,
    };
    fs.writeFileSync(cacheFileName, JSON.stringify(classifierModule), 'utf8')
  }

  // console.log(classifiers);
  return classifiers;
}

function readInTopic(topic: string, directory: string): TopicCollection {
  // console.log('dir', directory);
  const actions = [];
  fs.readdirSync(directory)
    .filter(file => !_.startsWith(file, '.'))
    .forEach(file => {
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
    location: directory,
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
    // console.log(`training ${key}`);
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

export function checkUsingClassifier(text: string, classifier: any, label: string, topic: string): Classification {
  const result = classifier.getClassifications(text)[0];
  if (result.label === 'false') {
    return null;
  }
  return {
    label: label.replace(/-/g, ' '),
    topic,
    value: result.value,
  };
}

export function runThroughClassifiers(text: string, classifiers: Classifiers, dump: Boolean = false) {
  const filtered: Array<Array<Classification>> = _.map(classifiers, (classifiers: Classifiers, topic: string) => {
    const trueClassifications = _.map(classifiers, (classifier, label) => checkUsingClassifier(text, classifier, label, topic));
    // console.log(topic, trueClassifications);
    return _.compact(trueClassifications);
  }) as any;

  let compacted: Array<Classification> = _.compact(_.flatten(filtered));
  // if (this && this.debugOn) { console.log('compacted', util.inspect(compacted, { depth: null })); };
  if (dump) { console.log('compacted', util.inspect(compacted, { depth: null })); }
  if (classifier === natural.LogisticRegressionClassifier) {
    compacted = compacted.filter(result => result.value > 0.6);
  }
  // if (this && this.debugOn) { console.log('filtered compacted', util.inspect(compacted, { depth: null })); };

  return compacted
}