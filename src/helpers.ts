let nlp = require('nlp_compromise');
import { Intent } from './index';

export interface Topics {
  people: Array<any>,
  places: Array<any>,
}

export function grabTopics(text: string): Promise<Intent> {
  const nlpProcessed = nlp.text(text);
  // console.log('nlpProcessed', nlpProcessed);
  return Promise.resolve({
    action: null,
    topic: 'details',
    details: {
      people: nlpProcessed.people(),
      places: nlpProcessed.places(),
      dates: nlpProcessed.dates(),
      value: nlp.value(text).number,
    }
  });
}
