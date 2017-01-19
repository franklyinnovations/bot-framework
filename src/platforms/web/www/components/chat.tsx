import * as React from 'react';
import { Container } from 'react-fbmessenger';
import { connect, Dispatch } from 'react-redux';

import { State, Conversations } from '../redux/store';
import { sendText } from '../redux/actions';


interface Props {
  conversation: Conversations;
  userid: string;
  sendText: (userid: string, text: string) => void;
}

const mapStateToProps = function(store: State) {
  return {
    userid: store.userid,
    conversation: store.conversation,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<State>) => {
  return {
    sendText: (userid: string, text: string) => sendText(userid, text)(dispatch),
  };
};

class Chat extends React.Component<Props, undefined> {
  constructor(props: Props) {
    super(props);
    this.sendText = this.sendText.bind(this);
  }

  sendText(text: string) {
    console.log(`should sent '${text}'`);
    this.props.sendText(this.props.userid, text);
  }

  render() {
    return (
      <Container
        page_id={'0'}
        conversation = {this.props.conversation}
        persistentMenu = {null}
        textBlurCallback = {defaultBlurCallback}
        postbackCallback = {defaultPostbackCallback}
        userTextCallback = {this.sendText}
        textFocusCallback = {defaultFocusCallback}
      />
    );
  }
}

export const defaultPostbackCallback = (payload: string, text: string) => {
  return;
};
export const defaultFocusCallback = () => {
  return;
};
export const defaultBlurCallback = () => {
  return;
};

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
