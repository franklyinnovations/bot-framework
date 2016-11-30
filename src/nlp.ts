import { Intent, User } from './types/bot';

export default class NLPBase {
  public processText<U extends User>(user: U, text: string): Promise<U> {
    if (typeof user.conversation === 'undefined') {
      user.conversation = [];
    }
    user.conversation = user.conversation.concat(text);
    return Promise.map(this.intents, intent => intent(text, user))
      .then(_.flatten)
      .then(_.compact)
      .then((intents: Array<Intent>) => this.reducer(intents, user))
      .then(intent => {
        user.intent = intent;
        for (let i = 0; i < this.skills.length; i++) {
          const result = this.skills[i](user);
          if (result !== null) {
            return result;
          }
        }
        return null;
      })
      .then(() => Promise.resolve(user));
  }
}