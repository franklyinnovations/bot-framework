let nlp = require('nlp_compromise');
import { Intent } from './index';

export interface Topics {
  people: Array<any>,
  places: Array<any>,
}

export function grabTopics(text: string): Promise<Intent> {
  const nlpProcessed = nlp.text(text);
  return Promise.resolve({
    request: null,
    details: {
      people: nlpProcessed.people(),
      places: nlpProcessed.places(),
    }
  });
}
