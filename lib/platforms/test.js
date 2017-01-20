"use strict";
var _ = require("lodash");
var Promise = require("bluebird");
var test_1 = require("../test");
var TestPlatform = (function () {
    function TestPlatform(bot) {
        this.testers = {};
        this.bot = bot;
        return this;
    }
    TestPlatform.prototype.start = function () {
        return Promise.resolve(this);
    };
    TestPlatform.prototype.stop = function () {
        return Promise.resolve(this);
    };
    TestPlatform.prototype.send = function (user, message) {
        var _this = this;
        var test = this.testers[user.id];
        return test.receive(message)
            .catch(function (err) {
            test.onError(err);
        })
            .then(function () { return _this; });
    };
    TestPlatform.prototype.receive = function (userId, message) {
        var user = {
            id: userId,
            platform: 'testing',
            _platform: this,
        };
        return this.bot.processMessage(user, message);
    };
    TestPlatform.prototype.newTest = function (userId) {
        if (userId === void 0) { userId = "test-" + _.random(999999); }
        var instance = new test_1.default(this, userId);
        this.testers[userId] = instance;
        return instance;
    };
    return TestPlatform;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TestPlatform;
