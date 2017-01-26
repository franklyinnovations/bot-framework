export { Intent, Incoming, GreetingFunction } from './types/bot';
export { User } from './types/user';
export { PlatformMiddleware } from './types/platform';
export { MessageTypes } from './types/message'

import * as Platforms from './platforms';
export { Platforms };

import Botler from './bot';
export default Botler;
