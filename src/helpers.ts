import * as _ from 'lodash';
import * as natural from 'natural';
const NGrams = natural.NGrams;
const tokenizer = new natural.WordTokenizer();
import * as util from 'util';
import * as Promise from 'bluebird';
import * as fs from 'fs';

import { Intent } from './index';
import { classifier, GenerateClassifier, TopicCollection, Classifiers, Classification, checkUsingClassifier, runThroughClassifiers } from './classifier';

export interface Topics {
  people: Array<any>;
  places: Array<any>;
}

const locations: locationMap = loadLocations(`${__dirname}/../nlp/locations`);
const dateClassifiers: Classifiers = GenerateClassifier([`${__dirname}/../nlp/dates`]);

export function grabTopics(text: string): Promise<Intent> {
  const datesCompacted = runThroughClassifiers(text, dateClassifiers);
  const datesGrouped = _.groupBy(datesCompacted, 'topic');

  const specials = _.compact(tokenizer.tokenize(text).filter(token => parseInt(token, 10)));

  const intent: Intent = {
    action: null,
    details: {
      dates:  _.mapValues(datesGrouped, (classifications: Array<Classification>) => classifications.map(classification => _.startCase(classification.label))),
      specialWords: specials,
      locations: locatonExtractor(text),
    },
    topic: 'details',
  };

  // if (this && this.debugOn) { console.log('details intent', util.inspect(intent, { depth: null })); };

  return Promise.resolve(intent);
}

function onlyDirectories(name: string): boolean {
  return !(_.startsWith(name, '.') || _.endsWith(name, '.json'));
}

function loadLocations(theDirectory: string): locationMap {
  const readLocations = {};
  fs.readdirSync(theDirectory)
    .filter((aDirectory: string) => onlyDirectories(aDirectory))
    .forEach(topic => {
      console.log('topic:', topic);
      readLocations[topic] = {};
      fs.readdirSync(`${theDirectory}/${topic}`)
        .filter(file => !_.startsWith(file, '.'))
        .forEach(file => {
          const key: string = /(.*).json/.exec(file)[1].replace(/-/g, ' ');
          const phrases: Array<string> = require(`${theDirectory}/${topic}/${file}`);
          readLocations[topic][key] = phrases;
        });
    });
  // console.log(readLocations);
  return readLocations;
}

export type locationMap = {
  [s: string]: {
    [s: string]: Array<string>
  };
};

function createTokens(text: string): Array<string> {
  const tokenized: Array<string> = tokenizer.tokenize(text);
  const biGrams = NGrams.ngrams(tokenized, 2).map((words) => words.join(' '));
  const triGrams = NGrams.ngrams(tokenized, 3).map((words) => words.join(' ')) as Array<string>;
  const ngrams: Array<string> = _.flatten(tokenized.concat(biGrams, triGrams)) as Array<string>;
  const allPhrases = ngrams.map(phrase => phrase.toLowerCase());
  return allPhrases;
}

export function locatonExtractor(text: string): any {
  const allPhrases = createTokens(text);
  // console.log('allPhrases', allPhrases);
  const matchingCities = _.mapValues(locations, topic =>
    _.pickBy(topic, (value: Array<string>, key: string) => {
      const theseCities = value.map(location => location.toLowerCase());
      // console.log(theseCities);
      return _.intersection(allPhrases, theseCities).length > 0;
    }));
  // console.log('matchingCities', matchingCities);
  const pickedTopics = _.pickBy(matchingCities, topic => _.keys(topic).length > 0);
  const mapped = _.mapValues(pickedTopics, topic => _.keys(topic));
  // console.log(matchingCities);
  return mapped as locationMap;
}

export function getLocationConfidence(text: string, searchLocation: string): number {
  let matchingCities = _.map(locations, (subLocations, key) => {
    // console.log(subLocations);
    return _.map(subLocations, (cities) => {
      // console.log(cities, searchLocation);
      const normalizedCities: Array<string> = cities.map(city => city.toLowerCase());
      return _.includes(normalizedCities, searchLocation.toLowerCase()) ? normalizedCities : null;
    });
  });

  const cityList = _.compact(_.flattenDeep<string>(matchingCities) as Array<string>);
  const allPhrases = createTokens(text);
  const matchingPhrase = _.intersection(allPhrases, cityList);

  const textTokenized: Array<string> = tokenizer.tokenize(text);
  const locationTokenized = tokenizer.tokenize(matchingPhrase[0]);

  return locationTokenized.length / textTokenized.length;
}