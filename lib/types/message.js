"use strict";
;
var button_1 = require("./messages/button");
exports.ButtonMessage = button_1.ButtonMessage;
exports.MessageTypes = {
    text: 'text',
    image: 'image',
    button: 'button',
    greeting: 'greeting',
    postback: 'postback',
    audio: 'audio',
};
