## Intents
An intent is something the user wants done. There are two main elements to an intent, the *topic* and the *action*.  

Elements of an intent
* topic: what the general topic of conversation for the intent is ('weather', 'sports', 'fashion', etc)
* action: the specific action the user asked for ('current forecast', 'current score', 'red dresses')
* details: anything else detected in the user input (the city, what game, product attributes)

The topic is the overall theme of the conversaton and makes it easier to understand the users meaning when there could be ambiguity. For example, is 'Boston' the city or band? If the topic for the last few of the user's intents have been weather, the city is more likely the correct interpretation

### Implementation
A function that takes the currently input text and the user object and returns a promise. The intent was chosen to be promise based in case it needs to make a call to another process or web api. For example, fyndbot queries the fynd suggestion api to detect if any fashion term was entered by the user.

### Example

