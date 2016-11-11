import * as Platform from '../types/platform';
import * as Bot from '../types/bot';
import * as readline from 'readline';
import Botler from '../index';

export class Console implements Platform.Middleware {
    private rl: readline.ReadLine;
    protected bot: Botler;
    constructor(botler: Botler) {
        this.bot = botler;
    }

    start() {
        //usually start listening on a port here
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.rl.on('line', (input: string) => {
            const user: Bot.User = this.bot.createEmptyUser();
            user.id = 'console';
            user.platform = 'console';
            this.bot.processText(user, input)
        });
        return Promise.resolve(this);
    }

    stop() {
        this.rl.close();
        //usually stop listening here
        return Promise.resolve(this);
    }

    send(message: Bot.Message) {
        if (message instanceof Bot.t)
        return Promise.resolve(this);
    }


}

class BaseSession implements Platform.Session {
    protected user_id: string;
    constructor(user_id: string) {
        this.user_id = user_id;
    }

    set user(text: string) {
        
    }

    get user() {
        return 'hi';
    }

    get intent {

    }

    sendText(text: string) {
        console.log('sending ')
        return Promise.resolve(this);
    }

    sendImage(url: string) {
        return Promise.resolve(this);
    }

    createButtons(url: string) {
        return new ButtonMessage(this.user_id);
    }

    createCarousel() {

    }
}

class Message implements Platform.Message {
    protected user_id: string;
    protected messageTitle: string;
    protected messageSubTitle: string;
    protected buttons: Array<MessengerButton>;
    protected image_url: string;
    protected elements: Array<MessengerItem>;

    constructor(user_id: string) {
        this.user_id = user_id;
    }
    send() {
        throw new Error('base class');
    }
}

class ButtonMessage extends Message implements Platform.ButtonMessage {
    
}