"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var facebook_1 = require("./facebook");
var Express = require("express");
var bodyParser = require("body-parser");
var Promise = require("bluebird");
var Web = (function (_super) {
    __extends(Web, _super);
    function Web(botler, port, fbport) {
        if (port === void 0) { port = 3000; }
        if (fbport === void 0) { fbport = 4100; }
        var _this = _super.call(this, botler, fbport) || this;
        _this.localServer = null;
        _this.localPort = port;
        _this.localApp = Express();
        _this.localApp.use(bodyParser.json());
        return _this;
    }
    Web.prototype.start = function () {
        var _this = this;
        this.localServer = this.localApp.listen(this.localPort, function () {
            if (_this.bot.debugOn) {
                console.log("Web platform listening on port " + _this.localPort);
            }
        });
        var __this = this;
        return Promise.all([
            _super.prototype.start.call(this),
        ])
            .then(function () { return __this; });
    };
    Web.prototype.stop = function () {
        var _this = this;
        this.localServer.close(function () {
            if (_this.bot.debugOn) {
                console.log('Web platform stopped');
            }
        });
        this.localServer = null;
        var __this = this;
        return Promise.all([
            _super.prototype.stop.call(this),
        ])
            .then(function () { return __this; });
    };
    return Web;
}(facebook_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Web;
