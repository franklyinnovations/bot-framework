import * as natural from 'natural';
import * as _ from 'lodash';
const fs = require('fs');


export const classifier = natural.LogisticRegressionClassifier;
// export const classifier = natural.BayesClassifier;

export function GenerateClassifier(directories: Array<string>) {
  const topics = {};
  directories.forEach(directory => fs.readdirSync(directory).forEach(topic => {
    const key = topic;
    // console.log('t:', topic, 'd:', directory);
    topics[topic] = GenerateTopicClassifier([`${directory}/${topic}`]);
  }));
  return topics;
}

export function GenerateTopicClassifier(directories: Array<string>) {
  const phrases = {};
  directories.forEach(directory => fs.readdirSync(directory).forEach(file => {
    const key = /(.*).json/.exec(file);
    // console.log(`loading '${key[1]}'`);
    try {
      phrases[key[1]] = require(`${directory}/${file}`);
    } catch(err) {
      throw new Error(`Invalid JSON file ${file}`);
    }
  }));

  const allPhrases = _.flatten(_.values(phrases)) as Array<string>;

  const classifiers = _.mapValues(phrases, (value: Array<string>, key: string) => { // eslint-disable-line no-unused-vars
    const thisClassifier = new classifier();
    const otherPhrases = _.difference(allPhrases, value);
    // console.log(value);
    value.forEach(phrase => thisClassifier.addDocument(phrase, 'true'));
    otherPhrases.forEach(phrase => thisClassifier.addDocument(phrase, 'false'));
    thisClassifier.train();

    // console.log(`--${key}--`);

    const othersChecked = otherPhrases.map(phrase => thisClassifier.classify(phrase)).map((classified, index) => {
      if (classified === 'true') {
        // console.log('other', index, otherPhrases[index], thisClassifier.getClassifications(otherPhrases[index]));
        return otherPhrases[index];
      }
      return null;
    });
    const selfChecked = value.map(phrase => thisClassifier.classify(phrase)).map((classified, index) => {
      if (classified === 'false') {
        // console.log('self', index, value[index], thisClassifier.getClassifications(value[index]));
        return value[index];
      }
      // console.log(value[index], thisClassifier.getClassifications(value[index]));
      return null;
    });
    // console.log('other:', otherPhrases.length, '  self:', value.length);
    // console.log('passed for other', _.compact(othersChecked));
    // console.log('failed for home', _.compact(selfChecked));
    return thisClassifier;
  });

  return classifiers;
}
