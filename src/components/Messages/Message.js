import React, {Component} from 'react';
import {Avatar, Layout} from 'antd';
import qoobee from "../../images/qoobee.jpg";
import background from "../../images/cutePig.png";
import '../../css/Messages/messages.css';
import 'font-awesome/css/font-awesome.min.css';
import connect from "react-redux/es/connect/connect";
import {ChatActions} from '../../Redux/Actions/ChatActions';
import {ChatService} from '../../Services/ChatService';

const {
    Header, Footer,
} = Layout;

const headerStyle = {
    height: '100px', backgroundColor: 'white', borderBottom: '1px solid #ebebe0 ', padding: '10px'
}

const footerStyle = {
    height: '80px', backgroundColor: 'white', borderTop: '1px solid #ebebe0 ', padding: '0px'
}

const ChatName = {
    marginTop: '-70px', marginLeft: '85px'
}

var typeCauseScroll = false
var pullCauseScroll = false
var changeMessageCauseScroll = false;

var checkedConversations = [];
var ownerId = JSON.parse(localStorage.getItem('user')) != null ? JSON.parse(localStorage.getItem('user')).phone : '';
var ownerName = JSON.parse(localStorage.getItem('user')) != null ? JSON.parse(localStorage.getItem('user')).userName : '';

class Message extends Component {

    constructor(props) {
        super(props);
        this.state = {
            currentConversationName: '',
            websocket: '',
            allMessages: new Map(),
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (typeCauseScroll) {
            // console.log(prevState.messages);
            let messageBoard = document.getElementById('messages');
            messageBoard.scroll(0, messageBoard.scrollHeight);
            typeCauseScroll = false;
            pullCauseScroll = false;
            changeMessageCauseScroll = false;
        } else if (pullCauseScroll) {
            // console.log(prevState.messages);
            let messageBoard = document.getElementById('messages');
            messageBoard.scroll(0, 20);
            typeCauseScroll = false;
            pullCauseScroll = false;
            changeMessageCauseScroll = false;
        } else if (changeMessageCauseScroll) {
            let messageBoard = document.getElementById('messages');
            messageBoard.scroll(0, messageBoard.scrollHeight);
            changeMessageCauseScroll = false;
            typeCauseScroll = false;
            pullCauseScroll = false;
        }

    }

    componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps.currentConversationId !== this.props.currentConversationId
            && !checkedConversations.includes(nextProps.currentConversationId)
        ) {
            console.log("selected chatId ", nextProps.currentConversationId);
            // this.props.getMessage(nextProps.currentConversationId, 0);
            ChatService.getMessages(nextProps.currentConversationId)
                .then(messages => {
                    console.log('message ', messages);
                    let temptAllMessage = this.state.allMessages;
                    let message1 = [];
                    console.log('12', this.state.allMessages.get(nextProps.currentConversationId))
                    if (messages != null) {
                        if(this.state.allMessages.get(nextProps.currentConversationId)==null) {
                            temptAllMessage.set(nextProps.currentConversationId, messages)
                            console.log('chua ton tai')
                        }
                        else{
                            let firstAllMessage = this.state.allMessages.get(nextProps.currentConversationId);
                            let mes = messages;
                            firstAllMessage = mes.concat(firstAllMessage);
                            console.log('first ',firstAllMessage)
                            // temptAllMessage.set(nextProps.currentConversationId, firstAllMessage);
                            // console.log('da ton tai')
                            temptAllMessage.set(nextProps.currentConversationId, messages)
                        }


                    } else {
                        temptAllMessage.set(nextProps.currentConversationId, message1)
                    }
                    changeMessageCauseScroll = true;
                    this.setState({allMessages: temptAllMessage});
                    checkedConversations.push(nextProps.currentConversationId);
                    console.log(this.state.allMessages);

                })
                .catch(error => {

                });

        } else {
            changeMessageCauseScroll = true;
            console.log('scroll to get messsage')
        }
        if (nextProps.socketMessage !== this.props.socketMessage) {
            console.log('socket message ', nextProps.socketMessage);
            let message = nextProps.socketMessage;
            let temptAllMessage = this.state.allMessages;
            let conversationID = message.conversationID;
            if(this.state.allMessages.get(conversationID)!=null){
                temptAllMessage.get(conversationID).push({
                    senderID: message.senderID,
                    senderName: message.senderName,
                    content: message.content,
                    time: message.time
                });
                this.setState({allMessages: temptAllMessage});
            }
            else{
                let temptAllMessage = this.state.allMessages;
                let messages = [{
                    senderID: message.senderID,
                    senderName: message.senderName,
                    content: message.content,
                    time: message.time
                }]
                temptAllMessage.set(conversationID, messages)
                this.setState({allMessages: temptAllMessage});
            }
        }

        // if (nextProps.messages !== this.props.messages) {
        //     console.log(isScrolling);
        //     if(!isScrolling) {
        //         console.log("id ", this.props.currentConversationId, " messsage", nextProps.messages.message);
        //         let temptAllMessage = this.state.allMessages;
        //         // temptAllMessage.push(nextProps.messages);
        //         temptAllMessage.set(this.props.currentConversationId, nextProps.messages.message)
        //         this.setState({currentMessages: nextProps.messages.message});
        //         this.setState({allMessages: temptAllMessage});
        //         // changeMessageCauseScroll = true;
        //         isScrolling = false;
        //     }
        //     else{
        //     }
        // }
        console.log(this.state.allMessages)
    }

    typeText = (event) => {
        // let code = (event.keyCode ? event.keyCode : event.which);
        if (event.keyCode === 13 && !event.shiftKey && this.props.currentConversationId != null) {
            let message = event.target.value;
            // let temptMessages = this.state.allMessages;
            // temptMessages.get(this.props.currentConversationId).push({
            //     sender: ownerId,
            //     senderName: ownerName,
            //     content: message
            // });
            // this.setState({allMessages: temptMessages});
            typeCauseScroll = true;
            pullCauseScroll = false;
            //send message to service API
            let messageToServer = {
                messageType: 'sendMessage',
                content: {
                    sender: ownerId,
                    content: message,
                    conversationID: this.props.currentConversationId
                }
            }
            this.props.websocket.send(JSON.stringify(messageToServer));
            document.getElementById('textArea').value = "";
        }
    }


    displayMessages = () => {
        if (this.props.currentConversationId != null && this.state.allMessages.get(this.props.currentConversationId) != null) {
            var obj = this.state.allMessages.get(this.props.currentConversationId);
            // this.state.currentConversationName
            console.log('display ', obj.length);
            if (obj.length > 0) {
                const messages = obj.map((item) =>
                    <li className={item.senderID == ownerId ? 'sent' : 'replies'}>
                        {/*<img src="http://emilcarlsson.se/assets/mikeross.png" alt=""/>*/}
                        <div className="sender">{item.senderName}</div>
                        <p>{item.content}</p>
                        <span>{new Date(parseInt(item.time)).toLocaleString()}</span>
                    </li>
                );
                return messages;
            }
        }
    }

    onMessageScroll = (event) => {

        let messageBoard = document.getElementById('messages');
        if (messageBoard.scrollTop === 0 && this.state.allMessages.get(this.props.currentConversationId) != null) {
            this.props.getMessage(this.props.currentConversationId);
            console.log("End");
            let messages = [
                {
                    id: "1",
                    sender: 'Nam',
                    type: 'sent',
                    message: "Nà ní"
                },
                {
                    id: "2",
                    sender: 'BigBid',
                    type: 'replies',
                    message: "nà ní 2"
                },
                {
                    id: "3",
                    sender: 'Nam',
                    type: 'sent',
                    message: "nà ní 2"
                }];
            this.appendMessages(messages);
            typeCauseScroll = false;
            pullCauseScroll = true;
        }

    }

    appendMessages = (messages) => {
        let temptMessages = messages.concat(this.state.messages);
        // temptMessages.concat(this.state.messages);
        // console.log(temptMessages);
        // this.setState({messages: temptMessages});
        // this.state.
        // console.log(this.state.messages);
    }


    render() {
        if (this.props.currentConversationId != null) {
            return (
                <Layout style={{borderLeft: "1px solid #ebebe0", backgroundColor: 'white'}} className="Layout">
                    <Header style={headerStyle}>
                        <Avatar size={80} src={qoobee}/>
                        <h3 style={ChatName}>{this.state.currentConversationName}</h3>
                    </Header>
                    <div className="messages" onScroll={this.onMessageScroll} id="messages">
                        <ul>
                            {this.displayMessages()}
                        </ul>
                    </div>

                    {/*<Footer style={footerStyle}>*/}
                    <div className="message-input">
                        <div className="wrap">
                            <form>
                                <textarea id="textArea" style={{backgroundColor: 'white'}}
                                          placeholder="Write your message... " onKeyDown={this.typeText}></textarea>
                            </form>
                            <div className="tool">
                                <button className="submit" onClick={this.typeText}><i className="fa fa-paper-plane"
                                                                                      style={{fontSize: '24px'}}></i>
                                </button>
                            </div>

                        </div>
                    </div>
                    {/*</Footer>*/}

                </Layout>
            );
        } else {
            return (
                <Layout style={{borderLeft: "1px solid #ebebe0", backgroundColor: 'white'}}>
                    <div className="backgroundChat" onScroll={this.onMessageScroll} id="messages">
                        <img src={background} alt="Notebook" style={{
                            maxWidth: '100%',
                            maxHeight: '100%'
                        }}/>
                    </div>
                </Layout>
            );
        }
    }
}

const mapStateToProps = (state) => {
    console.log()
    return {
        currentConversationId: state.chatReducer.conversationId,
        websocket: state.socketReducer.websocket,
        messages: state.chatReducer.messages,
        socketMessage: state.socketReducer.socketMessage,
    }
};
const mapDispatchToProps = (dispatch) => ({
    getMessage: (conversationId, index) => dispatch(ChatActions.get_Message(conversationId, index)),
});
export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Message);