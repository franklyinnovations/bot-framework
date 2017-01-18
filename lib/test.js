"use strict";
var _ = require("lodash");
var Promise = require("bluebird");
var Responses = require("./responses");
var util = require("util");
var greetingMessage = {
    type: 'greeting',
};
var TestState;
(function (TestState) {
    TestState[TestState["notStarted"] = 0] = "notStarted";
    TestState[TestState["running"] = 1] = "running";
    TestState[TestState["error"] = 2] = "error";
    TestState[TestState["done"] = 3] = "done";
})(TestState = exports.TestState || (exports.TestState = {}));
var Tester = (function () {
    function Tester(platform, userId) {
        if (userId === void 0) { userId = "test-" + _.random(999999); }
        this.script = [greetingMessage];
        this.step = 0;
        this.thePromise = Promise.resolve();
        this.state = TestState.notStarted;
        this.timeout = 20;
        this.checkforExtraDialogs = true;
        this.testPlatfom = platform;
        this.userId = userId;
    }
    Tester.prototype.expectTextResponse = function (allowedPhrases) {
        this.script.push(new Responses.TextResponse(allowedPhrases));
        return this;
    };
    Tester.prototype.sendTextMessage = function (text) {
        var message = {
            type: 'text',
            text: text,
        };
        this.script.push(message);
        return this;
    };
    Tester.prototype.run = function () {
        var savedThis = this;
        this.publicPromise = new Promise(function (resolve, reject) {
            savedThis.resolve = resolve;
            savedThis.reject = reject;
        });
        this.execute();
        return this.publicPromise;
    };
    Tester.prototype.checkForTrailingDialogs = function (bool) {
        this.checkforExtraDialogs = bool;
        return this;
    };
    Tester.prototype.execute = function () {
        var _this = this;
        var i = this.step;
        var _loop_1 = function () {
            var nextStep = this_1.script[i];
            if (nextStep instanceof Responses.Response) {
                return { value: this_1.thePromise };
            }
            else {
                this_1.step = this_1.step + 1;
                this_1.thePromise = this_1.thePromise.then(function () { return _this.testPlatfom.receive(_this.userId, nextStep); });
            }
        };
        var this_1 = this;
        for (i; i < this.script.length; i++) {
            var state_1 = _loop_1();
            if (typeof state_1 === "object")
                return state_1.value;
        }
        if (this.step >= this.script.length) {
            var savedThis_1 = this;
            if (this.checkforExtraDialogs === false) {
                savedThis_1.resolve();
                return;
            }
            this.timer = setTimeout(function () {
                if (savedThis_1.state !== TestState.error) {
                    savedThis_1.resolve();
                }
            }, this.timeout);
        }
    };
    Tester.prototype.receive = function (message) {
        var _this = this;
        if (this.step >= this.script.length) {
            this.state = TestState.error;
            var err = new Error("received '" + util.inspect(message) + "' after script completed");
            this.reject(err);
            return Promise.reject(err);
        }
        var currentStep = this.script[this.step];
        if (currentStep instanceof Responses.Response) {
            this.step++;
            return Promise.resolve()
                .then(function () { return currentStep.check(message); })
                .then(function () { return _this.execute(); });
        }
        return Promise.resolve();
    };
    Tester.prototype.onError = function (err) {
        if (this.state === TestState.error) {
            return;
        }
        if (!this.reject) {
            console.error('no reject function yet');
            throw new Error('no reject function yet');
        }
        this.state = TestState.error;
        this.reject(err);
    };
    return Tester;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Tester;
