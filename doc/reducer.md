## Reducer

The reducer takes all array of results and returns a single intent. The default reducer takes the first intent that returns a valid action and then merges all the intents' details, this allowes intents to become small modules. For example, out of the box, a 'topic intent' is always run that tries to extract people and numbers from the text stream.
