import { PlatformMiddleware } from '../types/platform';
import { Message } from '../types/bot';
import * as Bot from '../types/bot';
import { User } from '../types/user';
import * as readline from 'readline';
import Botler from '../index';

export default class Console implements PlatformMiddleware {
    private rl: readline.ReadLine;
    protected bot: Botler;
    protected theUser:User;
    constructor(botler: Botler) {
        this.bot = botler;
    }

    public start() {
        // usually start listening on a port here
        // reset user
        this.theUser = this.bot.createEmptyUser({
            id: 0,
            platform: 'console',
            _platform: this,
        });
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.bot.processGreeting(this.theUser);

        this.rl.on('line', (input: string) => {
            console.log(`user said "${input}"`);
            const message:Bot.IncomingMessage = {
                type: 'text',
                text: input,
            };
            this.bot.processMessage(this.theUser, message)
        });
        return Promise.resolve(this);
    }

    public stop() {
        this.rl.close();
        //usually stop listening here
        return Promise.resolve(this);
    }

    public send<M extends Message.Message>(message: M) {
        switch(message.type) {
            case 'text':
                const textMessage: Message.TextMessage = message as any;
                const text = textMessage.text;
                console.log(`-> ${text}`);
                break;
        }
        return Promise.resolve(this);
    }
}