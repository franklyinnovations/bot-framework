"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var messages = require("../types/message");
var ValidationException = (function (_super) {
    __extends(ValidationException, _super);
    function ValidationException() {
        var _this = _super.call(this, 'validation error') || this;
        // Set the prototype explicitly.
        Object.setPrototypeOf(_this, ValidationException.prototype);
        return _this;
    }
    return ValidationException;
}(Error));
exports.ValidationException = ValidationException;
var Response = (function () {
    function Response() {
        this.type = null;
    }
    Response.prototype.check = function (message) {
        if (message.type !== this.type) {
            throw new ValidationException();
        }
    };
    return Response;
}());
exports.Response = Response;
var TextResponse = (function (_super) {
    __extends(TextResponse, _super);
    function TextResponse(allowedPhrases) {
        var _this = _super.call(this) || this;
        if (_.isArray(allowedPhrases)) {
            _this.allowedPhrases = allowedPhrases;
        }
        else {
            _this.allowedPhrases = [allowedPhrases];
        }
        _this.type = messages.MessageTypes.text;
        return _this;
    }
    TextResponse.prototype.check = function (message) {
        var textCheck = this.allowedPhrases.length === 0 ? true : _.includes(this.allowedPhrases, message.text);
        if (textCheck === false) {
            throw new Error("Text mismatch expected '" + this.allowedPhrases + "', but got '" + message.text + "'");
        }
        _super.prototype.check.call(this, message);
    };
    return TextResponse;
}(Response));
exports.TextResponse = TextResponse;
var ImageResponse = (function (_super) {
    __extends(ImageResponse, _super);
    function ImageResponse(url) {
        var _this = _super.call(this) || this;
        _this.url = url;
        _this.type = messages.MessageTypes.image;
        return _this;
    }
    ImageResponse.prototype.check = function (message) {
        if (this.url === message.url) {
            throw new Error("URL mismatch expected '" + this.url + "', but got '" + message.url + "'");
        }
        _super.prototype.check.call(this, message);
    };
    return ImageResponse;
}(Response));
exports.ImageResponse = ImageResponse;
// export class AudioResponse extends ImageResponse {
//   constructor(url: string) {
//     super(url);
//   }
//   public type: ResponseTypes = ResponseTypes.audio_attachment;
// }
// export class FileResponse extends ImageResponse {
//   constructor(url: string) {
//     super(url);
//   }
//   public type: ResponseTypes = ResponseTypes.file_attachment;
// }
// export class VideoResponse extends ImageResponse {
//   constructor(url: string) {
//     super(url);
//   }
//   public type: ResponseTypes = ResponseTypes.video_attachment;
// }
// export class QuickRepliesResponse extends TextResponse {
//     protected buttons: Array<sendTypes.Button>;
//     constructor(allowedPhraes: Array<string> = [], buttonArray: Array<sendTypes.Button> = []) {
//         super(allowedPhraes);
//         this.buttons = buttonArray;
//     }
//     public type: ResponseTypes = ResponseTypes.quick_replies;
//     check(message: messages.Message): boolean {
//         const buttonsMatch = _.intersectionWith(this.buttons, payload.message.quick_replies, _.isEqual).length >= this.buttons.length;
//         if (buttonsMatch === false) {
//           throw new Error(`button content doesn't match`);
//         }
//         return super.check(payload) && buttonsMatch;
//     }
// }
// export class ButtonTemplateResponse extends Response {
//     protected allowedText: Array<string>;
//     protected buttons: Array<sendTypes.Button>;
//     constructor(allowedText: Array<string> = [], buttonArray: Array<sendTypes.Button> = []) {
//         super();
//         this.allowedText = allowedText;
//         this.buttons = buttonArray;
//     }
//     public type: ResponseTypes = ResponseTypes.button_template;
//     check(message: messages.Message): boolean {
//         const attachment = payload.message.attachment.payload as sendTypes.ButtonPayload;
//         const textMatches = _.includes(this.allowedText, attachment.text);
//         if (textMatches === false) {
//           throw new Error(`text doesn't match expected '${this.allowedText}' but recieved '${attachment.text}'`);
//         }
//         const buttonsMatch = _.intersectionWith(this.buttons, attachment.buttons, _.isEqual).length >= this.buttons.length;
//         if (buttonsMatch === false) {
//           throw new Error(`button doesn't match`);
//         }
//         return super.check(payload) && textMatches && buttonsMatch;
//     }
// }
// export class GenericTemplateResponse extends Response {
//     protected _elementCount: number = -1;
//     constructor() {
//         super();
//     }
//     public type: ResponseTypes = ResponseTypes.generic_template;
//     elementCount(equalTo: number): this {
//         this._elementCount = equalTo;
//         return this;
//     }
//     check(message: messages.Message): boolean {
//         const attachment = payload.message.attachment.payload as sendTypes.GenericPayload;
//         const elementCount = this._elementCount === -1 ? true : this._elementCount === attachment.elements.length;
//         if (elementCount === false) {
//           throw new Error(`element's have different count expected ${this._elementCount} but received ${attachment.elements.length}`);
//         }
//         return super.check(payload) && elementCount;
//     }
// }
// export class ReceiptTemplateResponse extends Response {
//     protected _elementCount: number = -1;
//     constructor() {
//         super();
//     }
//     public type: ResponseTypes = ResponseTypes.receipt_template;
//     elementCount(equalTo: number): this {
//         this._elementCount = equalTo;
//         return this;
//     }
//     check(message: messages.Message): boolean {
//         const attachment = payload.message.attachment.payload as sendTypes.ReceiptPayload;
//         const elementCount = this._elementCount === -1 ? true : this._elementCount === attachment.elements.length;
//         if (elementCount === false) {
//           throw new Error(`element's have different count expected ${this._elementCount} but received ${attachment.elements.length}`);
//         }
//         return super.check(payload) && elementCount;
//     }
// } 
