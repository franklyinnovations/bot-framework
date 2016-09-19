import * as nlp from 'nlp_compromise';
import * as _ from 'lodash';
import * as natural from 'natural';
import * as util from 'util';

import { Intent } from './index';
import { classifier, GenerateClassifier, TopicCollection, Classifiers, Classification, checkUsingClassifier, runThroughClassifiers } from './classifier';

export interface Topics {
  people: Array<any>;
  places: Array<any>;
}

const locationClassifiers: Classifiers = GenerateClassifier([`${__dirname}/../nlp/locations`]);

export function grabTopics(text: string): Promise<Intent> {
  const nlpProcessed = nlp.text(text);
  // console.log('nlpProcessed', nlpProcessed);

  const compacted = runThroughClassifiers(text, locationClassifiers, true);
  const grouped = _.groupBy(compacted, 'topic');
  const intent:Intent = {
    action: null,
    details: {
      dates: nlpProcessed.dates(),
      people: nlpProcessed.people(),
      value: nlp.value(text).number,
      locations: _.mapValues(grouped, (classifications: Array<Classification>) => classifications.map(classification => _.startCase(classification.label))),
    },
    topic: 'details',
  };

  // if (this && this.debugOn) { console.log('details intent', util.inspect(intent, { depth: null })); };

  return Promise.resolve(intent);
}
