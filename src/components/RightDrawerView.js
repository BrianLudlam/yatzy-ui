import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Drawer, List, Radio, Input, Row, Badge, Statistic } from 'antd';

import { genMnemonic, testMnemonic } from "../ExtdevYatsyContracts";

import { uiChangeDrawerView, uiToggleCreateModal, loginAccount, logoutAccount
         } from '../actions';

const { TextArea } = Input;

class RightDrawerView extends PureComponent {

  state = {
    mnemonic: undefined
  }

  doLogin = () => {
    const { dispatch } = this.props;
    const { mnemonic } = this.state;
    if (!!mnemonic && testMnemonic(mnemonic)) {
      console.log('doLogin mnemonic: ', mnemonic)
      dispatch(loginAccount({mnemonic}));
      this.setState({ mnemonic: undefined });
    } else if (!!mnemonic) {
      console.log('doLogin mnemonic fail: ', mnemonic)
    } 
  }

  doLogout = () => {
    const { dispatch } = this.props;
    dispatch(logoutAccount());
    this.setState({ mnemonic: undefined });
  }

  randomMnemonic = () => {
    const mnemonic = genMnemonic();
    this.setState({ mnemonic });
  }

  onMnemonicChanged = (e) => {
    console.log(e);
    const mnemonic = (!e || !e.target) ? genMnemonic() : 
      e.target.value.toString().trim();
    this.setState({ mnemonic });
  }

  render () {
    const { loadingAccount, mountingAccount, account, txs, txLog, balance, 
            events, eventLog, uiRightDrawerOpen, uiRightDrawerView, 
            dispatch } = this.props;
    const { mnemonic } = this.state;

    return (
      <Drawer
        title={
          <Radio.Group buttonStyle="solid"
            value={uiRightDrawerView} 
            onChange={(e) => dispatch(uiChangeDrawerView({open: true, view: e.target.value}))}>
            <Radio.Button value="nodes" style={uiRightDrawerView!=="account"?{color: "#ffc107", backgroundColor: "#002950"}:{color: "#002950"}}>Account</Radio.Button>
            <Radio.Button value="events" style={uiRightDrawerView!=="events"?{color: "#ffc107", backgroundColor: "#002950"}:{color: "#002950"}}>Events</Radio.Button>
            <Radio.Button value="txs" style={uiRightDrawerView!=="txs"?{color: "#ffc107", backgroundColor: "#002950"}:{color: "#002950"}}>Txs</Radio.Button>
          </Radio.Group>
        }
        placement="right"
        closable={true}
        maskClosable={true}
        onClose={() => dispatch(uiChangeDrawerView({open: false}))}
        visible={uiRightDrawerOpen}
        width={300}>

        {(uiRightDrawerView === 'events') ? (
          <Row style={{ marginTop: "-16px" }}>
          <List
            size="small"
            itemLayout="horizontal"
            dataSource={events || []}
            renderItem={(key) => this.eventLogView(eventLog[key], account, dispatch)}/>
          </Row>

        ) : (uiRightDrawerView === 'txs') ? (
          <Row style={{ marginTop: "-16px" }}>
          <List
            itemLayout="horizontal"
            dataSource={(txs || [])}
              //.filter((each) => !!txLog[each])
              //.sort((a,b)=>((txLog[b].timestamp < txLog[a].timestamp) ? -1 : 1))}
            renderItem={(key) => (
              <List.Item><span>
                <strong>{txLog[key].title+' Tx: '}</strong>
                <a href={'http://extdev-blockexplorer.dappchains.com/tx'+key} target="_blank" rel="noopener noreferrer"> 
                  {key.substring(0,12)+'...'}
                </a>
                &nbsp;
                {((!txLog[key].status) ? <Badge status="error" text="FAILED"/> : 
                  (!!txLog[key].confirmCount && txLog[key].confirmCount === 12) ? 
                    <Badge status="success" text="VERIFIED"/>: (!!txLog[key].confirmCount) ? 
                      <Badge status="warning" text={'Confirmed '+txLog[key].confirmCount+' time(s)'}/> : 
                      <Badge status="processing" text="Pending"/>)}
              </span></List.Item>
            )}/>
          </Row>
        ) : (//account
          <>
          {!account && (
            <Row style={{ margin: "4px", padding:"0px 8px" }}>
              <TextArea rows={3} style={{ width:"100%" }}
                value={mnemonic} onChange={this.onMnemonicChanged} />
            </Row>
          )}
          {!account && (
            <Row style={{ margin: "4px", padding:"0px 8px" }}>
              <Button type="primary" onClick={this.doLogin}>Login</Button>
              <Button type="primary" onClick={this.randomMnemonic}
                 style={{ margin:"0px 8px" }}>Random</Button>
            </Row>
          )}
          {!!account && (
            <Row style={{ margin: "4px", padding:"0px 8px", fontSize:"18px" }}>
              <Statistic title="Account Address" value={account} />
            </Row>
          )}
          {!!account && (
            <Row style={{ margin: "4px", marginTop: "12px", padding:"0px 8px", fontSize:"18px" }}>
              <Statistic title="YATZ Coin Balance" value={balance} />
            </Row>
          )}
          {!!account && (
            <Row style={{ margin: "12px 0 0 4px", padding:"0px 8px" }}>
              <Button type="primary" onClick={this.doLogout}>Logout</Button>
            </Row>
          )}
          </>
        )}
      </Drawer>
    );
  }

  eventLogView = (e, account, dispatch) => (
    (!e) ? '' : 
    (e.event === "PlayerSit") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Seated at Table ID: '+e.returnValues.tableId+' - Seat '+e.returnValues.seat}
      </span></List.Item> : 
    (e.event === "PlayerGame") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Game ID: '+e.returnValues.gameId+' - Registered'}
      </span></List.Item> : 
    (e.event === "ScoreReward") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Game ID: '+e.returnValues.gameId+' - Score Reward - '+e.returnValues.reward+' YATZ Coins!'}
      </span></List.Item> : 
    (e.event === "GameStarted") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Game ID: '+e.returnValues.gameId+' - Started'}
      </span></List.Item> : 
    (e.event === "TurnContinued") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Turn continued with bank '+e.returnValues.bank.map((each) => each.toString()).join(' ')}
      </span></List.Item> : 
    (e.event === "GameContinued") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Game ID: '+e.returnValues.gameId+' - Turn '+e.returnValues.turn+
          ' - Score '+e.returnValues.score+' ('+e.returnValues.tally.join(' ')+')'}
      </span></List.Item> : 
    (e.event === "GameEnded") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Game ID: '+e.returnValues.gameId+' - Ended - Score '+e.returnValues.score+
          ' ('+e.returnValues.tally.join(' ')+')'}
      </span></List.Item> : ''
  );
 
}

RightDrawerView.propTypes = {
  loadingAccount: PropTypes.bool,
  mountingAccount: PropTypes.bool,
  account: PropTypes.string,
  balance: PropTypes.string,
  block: PropTypes.object,
  txs: PropTypes.array,
  txLog: PropTypes.object,
  events: PropTypes.array,
  eventLog: PropTypes.object,
  uiRightDrawerOpen: PropTypes.bool,
  uiRightDrawerView: PropTypes.string
}

export default connect((state) => ({
  loadingAccount: state.loadingAccount,
  mountingAccount: state.mountingAccount,
  account: state.account,
  balance: state.balance,
  block: state.block,
  txs: state.txs,
  txLog: state.txLog,
  events: state.events,
  eventLog: state.eventLog,
  uiRightDrawerOpen: state.uiRightDrawerOpen,
  uiRightDrawerView: state.uiRightDrawerView
}))(RightDrawerView); 