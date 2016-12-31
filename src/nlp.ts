import { classifier, GenerateClassifier, TopicCollection, Classifiers, Classification, checkUsingClassifier, runThroughClassifiers } from './classifier';
import { Intent } from './types/bot';
import { IncomingMessage } from './types/bot';
import { grabTopics, locatonExtractor, getLocationConfidence } from './helpers';
import { IntentGenerator } from './types/bot';

import * as _ from 'lodash';
import * as util from 'util';

export const defaultClassifierDirectories: Array<string> = [`${__dirname}/../nlp/phrases`];

export default class NLPBase implements IntentGenerator {
  public classifiers: Classifiers;
  private components: Array<(text: string) => Promise<Array<Intent>>>;
  constructor(classifierFiles: Array<string|TopicCollection> = defaultClassifierDirectories) {
    const allClassifiers = GenerateClassifier(classifierFiles, `${__dirname}/../nlp/classifiers.json`);
    this.classifiers = allClassifiers;
    this.components = [
      baseBotTextNLP.bind(this),
      locationNLP.bind(this),
      grabTopics.bind(this)
    ];
    return this;
  }

  public getIntents(message: IncomingMessage): Promise<Array<Intent>> {
    if (message.type === 'text') {
      const promises = this.components.map(func => func(message.text));
      return Promise.all(promises)
      .then(intents => {
        const flat = _.flatten(intents);
        return flat;
      });
    } else {
      return Promise.resolve([]);
    }
  }

  public retrainClassifiers(classifierFiles: Array<string|TopicCollection> = defaultClassifierDirectories) {
    const allClassifiers = GenerateClassifier(classifierFiles);
    this.classifiers = allClassifiers;
  }

  public getTopics(): any {
    const topics = _.mapValues(this.classifiers, (value, key) => _.keys(value).map(key => key.replace(/-/g, ' ')));
    return topics;
  }
}

export function baseBotTextNLP(text: string): Promise<Array<Intent>> {
  const compacted = runThroughClassifiers(text, this.classifiers);

  if (compacted.length === 0) {
    return null;
  }
  const sorted: Array<Classification> = _.orderBy(compacted, ['value'], 'desc');
  if (this && this.debugOn) { console.log(`${text}\n${util.inspect(sorted, { depth:null })}`); };

  const intents: Array<Intent> = sorted.map(intent => {
    const baseIntent: Intent = {
      action: intent.label,
      details: {
        confidence: intent.value,
      },
      topic: intent.topic,
    };

    return baseIntent;
  });

  return Promise.resolve(intents);
}

export function locationNLP(text: string): Promise<Array<Intent>> {
  const locations = locatonExtractor(text);
  if (_.keys(locations).length === 0) {
    return Promise.resolve([]);
  }

  const action: string = _.keys(locations)[0];
  const city: string = locations[action][0];

  const intent: Intent = {
    action: action,
    details: {
      confidence: getLocationConfidence(text, city),
    },
    topic: 'locations',
  };

  return Promise.resolve([intent]);
}