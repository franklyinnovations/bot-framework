"use strict";
var util = require("util");
var _ = require("lodash");
var Promise = require("bluebird");
function defaultReducer(intents) {
    var _this = this;
    return Promise.resolve(_.compact(intents))
        .then(function (validIntents) { return _.orderBy(validIntents, function (intent) { return intent.details.confidence || 0; }, 'desc'); })
        .then(function (validIntents) {
        if (_this.debugOn) {
            console.log('validIntents', util.inspect(validIntents, { depth: null }));
        }
        ;
        if (validIntents.length === 0) {
            var unknownIntent = {
                action: 'none',
                details: {
                    confidence: 0,
                },
                topic: null,
            };
            return unknownIntent;
        }
        var mergedDetails = _.defaults.apply(_this, validIntents.map(function (intent) { return intent.details; }));
        var firstIntent = validIntents[0];
        firstIntent.details = mergedDetails;
        if (_this.debugOn) {
            console.log('fI', firstIntent);
        }
        ;
        return firstIntent;
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defaultReducer;
