## Intents
A function that takes the currently input text and the user object and returns an intent through a promise. The intent was chosen to be promise based in case it needs to make a call to another process or web api. For example, fyndbot queries the fynd suggestion api to detect if any fashion term was entered by the user.
