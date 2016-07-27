## Intents

An intent is something the user wants done. There are two main elements to an intent, the *topic* and the *action*.  

The topic is the overall theme of the conversaton and makes it easier to understand the users meaning when there could be ambiguity. For example, is 'Boston' the city or band? If the topic for the last few of the user's intents have been weather, the city is more likely the correct interpretation

The action is what the user would like done, examples could be "play music", "get weather forcast".

### Implementation
A function that takes the currently input text and the user object and returns an intent through a promise. The intent was chosen to be promise based in case it needs to make a call to another process or web api. For example, fyndbot queries the fynd suggestion api to detect if any fashion term was entered by the user.
