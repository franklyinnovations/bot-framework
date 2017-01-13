import { Intent } from './types/bot';
import * as util from 'util';
import * as _ from 'lodash';
import * as Promise from 'bluebird';

export default function defaultReducer(intents: Array<Intent>): Promise<Intent> {
  return Promise.resolve(_.compact(intents))
    .then((validIntents: Array<Intent>) => _.orderBy(validIntents, (intent: Intent) => intent.details.confidence || 0, 'desc'))
    .then((validIntents: Array<Intent>) => {
      if (this.debugOn) { console.log('validIntents', util.inspect(validIntents, { depth: null })); };
      if (validIntents.length === 0) {
        const unknownIntent: Intent = {
          action: 'none',
          details: {
            confidence: 0,
          },
          topic: null,
        };
        return unknownIntent;
      }
      const mergedDetails = _.defaults.apply(this, validIntents.map(intent => intent.details));
      const firstIntent = validIntents[0];
      firstIntent.details = mergedDetails;
      if (this.debugOn) { console.log('fI', firstIntent); };
      return firstIntent;
    });
}
