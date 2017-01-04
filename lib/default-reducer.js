"use strict";
const util = require("util");
const _ = require("lodash");
function defaultReducer(intents) {
    return Promise.resolve(_.compact(intents))
        .then((validIntents) => _.orderBy(validIntents, (intent) => intent.details.confidence || 0, 'desc'))
        .then((validIntents) => {
        if (this.debugOn) {
            console.log('validIntents', util.inspect(validIntents, { depth: null }));
        }
        ;
        if (validIntents.length === 0) {
            const unknownIntent = {
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
        if (this.debugOn) {
            console.log(firstIntent);
        }
        ;
        return firstIntent;
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defaultReducer;
