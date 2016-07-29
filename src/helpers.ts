import * as nlp from 'nlp_compromise';
import { Intent } from './index';

export interface Topics {
  people: Array<any>;
  places: Array<any>;
}

export function grabTopics(text: string): Promise<Intent> {
  const nlpProcessed = nlp.text(text);
  // console.log('nlpProcessed', nlpProcessed);
  return Promise.resolve({
    action: null,
    details: {
      dates: nlpProcessed.dates(),
      people: nlpProcessed.people(),
      value: nlp.value(text).number,
    },
    topic: 'details',
  });
}
