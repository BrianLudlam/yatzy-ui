import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Layout, Row, Col, Spin, Modal, Button, Select, Icon, Descriptions, Statistic } from 'antd';
import DappNavbar from "./components/DappNavbar";
import RightDrawerView from "./components/RightDrawerView";

import { startGameTx, continueGameTx, abortGameTx, scoreCategory, 
         nameOfCategory } from "./ExtdevYatsyContracts";

import { sendTx, startGame, continueGame, abortGame, uiChangeDrawerView } from './actions';

import { RollingDice, OnOne, OnTwo, OnThree, OnFour, OnFive, OnSix,
         OffOne, OffTwo, OffThree, OffFour, OffFive, OffSix, CupRoll, 
         YellowCupRoll } from './constants';

const { Content, Footer } = Layout;

const InitTally = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const InitBankSelect = [true, true, true, true, true];
const InitBankFilter = [0,0,0,0,0,0];

class App extends Component { 

  state = {
    bankSelect: [...InitBankSelect],
    bankFilter: [...InitBankFilter],
    tally: [...InitTally],
    score: 0
  }

  componentDidMount() {
    window.addEventListener("beforeunload", this.unmount);
    this.mount();
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.unmount);
    this.unmount();
  }

  componentDidUpdate(prevProps) {
    const { roll } = this.props;

    if (prevProps.roll !== roll){
      const bankSelect = [...InitBankSelect];
      const bankFilter = [...InitBankFilter];
      roll.forEach((one) => { if (one > 0) bankFilter[one-1]++; })
      this.setState({bankSelect, bankFilter});
    }
  }

  mount = () => {
    //this.props.dispatch(loadWeb3());
    
  }

  unmount = () => {
    Modal.destroyAll();
  }

  doStartGame = () => {
    const { contracts, dispatch } = this.props;
    if (!contracts) return;
    console.log('App doStartGame...')
    const key = contracts.genKey();
    const hash = contracts.hashKey(key);
    if (!key || !hash) return;
    dispatch(startGame({key}));
    dispatch(sendTx(startGameTx({hash})));
  }

  doRollAgain = () => {
    const { contracts, rollKey, gameTurnRoll, dispatch } = this.props;
    const { bankSelect, bankFilter } = this.state;
    
    if (!contracts) return;

    const rollCount = 5 - bankFilter.reduce((total, each) => total + each);
    if(gameTurnRoll === 3 || rollCount === 0) return;
    
    const nextKey = contracts.genKey();
    const nextHash = contracts.hashKey(nextKey);
    if (!nextKey || !nextHash) return;

    console.log('App doRollAgain, bankFilter: ', bankFilter)

    const roll = this.props.roll.map((each, index) => (bankSelect[index]) ? each : 0);
    //required to include valid cat, even though matters not, so just select net available
    let cat = 0;
    while (cat < this.state.tally.length && this.state.tally[cat] !== 0) cat++;
    if (cat > 14) return;

    dispatch(continueGame({key: nextKey, rollCount, roll }));
    dispatch(sendTx(continueGameTx({key: rollKey, nextHash, bankFilter, cat})));
  }

  doScoreCategory = (cat) => {
    const { contracts, rollKey, dispatch } = this.props;
    const { bankFilter } = this.state;

    if (!contracts) return;
    if(cat < 0 || cat > 14 || this.state.tally[cat] !== 0 || 
        bankFilter.reduce((total, each) => total + each) !== 5) return;

    const nextKey = contracts.genKey();
    const nextHash = contracts.hashKey(nextKey);
    if (!nextKey || !nextHash) return;

    console.log('App doScoreCategory, bankFilter:', bankFilter)

    let catScore = scoreCategory(cat, bankFilter);
    if (catScore === 0) catScore = 255;
    const tally = [...this.state.tally];
    tally[cat] = catScore;
    const score = tally.map((value) => (value === 255) ? 0 : value)
      .reduce((total, each) => total + each)

    dispatch(continueGame({key: nextKey, rollCount: 5, roll: [0,0,0,0,0] }));
    dispatch(sendTx(continueGameTx({key: rollKey, nextHash, bankFilter:[5,5,5,5,5,5], cat})));
    this.setState({ tally, score, bankFilter: [...InitBankFilter], bankSelect: [...InitBankSelect] });
  }

  doAbortGame = () => {
    const { dispatch } = this.props;
    console.log('App doAbortGame...')
    dispatch(abortGame());
    dispatch(sendTx(abortGameTx()));
  }

  onBankChange = (index) => {
    const { gameStatus, gameTurnRoll, roll } = this.props;
    //console.log('onBankChange selected', bankSelect);
    if (gameStatus === 'player' && gameTurnRoll < 3) {
      const bankSelect = [...this.state.bankSelect];
      bankSelect[index] = !bankSelect[index];

      const bankFilter = [...InitBankFilter];
      roll.forEach((one, index) => { if (one > 0 && bankSelect[index]) bankFilter[one-1]++; })
      this.setState({bankSelect, bankFilter});
    }
  };
/*
  onBankChange = (bankSelect) => {
    const { roll } = this.props;
    //console.log('onBankChange selected', bankSelect);
    this.setState({bankSelect});
    const bankFilter = [0,0,0,0,0,0];
    for (let i=0; i<bankSelect.length; i++) {
      const index = bankSelect[i];
      const value = roll[index] - 1;
      bankFilter[value]++;
    }
    this.setState({bankFilter});
  };
*/

  render() {
    const { contracts, accountError, account, roll, rollStatus, rollKey, rollBlock,
            gameStatus, gameId, gameTurn, gameTurnRoll, dispatch } = this.props;
    const { bankSelect, bankFilter, catSelect, score, tally } = this.state;

    console.log('this.state: ', this.state);

    const readyPlayer = (gameStatus === 'player' && rollStatus === 'rolled')

    const readyToScore = (readyPlayer && (bankSelect.every((one) => one) || gameTurnRoll === 3))

    const readyToRoll = (readyPlayer && !readyToScore)

    return (
      <Layout>
        <DappNavbar />
        <Layout>
          <Content>
            <RightDrawerView />
            {gameStatus === 'idle' && (
            <Row type='flex' justify='center' style={{ margin: "4px", marginTop: "8px" }}>
              <h3>Welcome to Block Yatzy!</h3>
            </Row>
            )}
            {gameStatus === 'idle' && !account && (
            <Row type='flex' justify='center' style={{ margin: "4px", marginTop: "4px"}}>
              <h5 onClick={() => dispatch(uiChangeDrawerView({open: true, view: 'account'}))}>
                Login or create an account.
              </h5>
            </Row>
            )}
            {gameStatus === 'idle' && !!account && (
            <Row type='flex' justify='center' style={{ margin: "4px", marginTop: "4px" }}>
              <h5>Start a game when ready.</h5>
            </Row>
            )}
            {gameStatus === 'idle' && !!account && (
              <Row type='flex' justify='center' style={{ margin: "4px", marginTop: "14px" }}>
                <Button type="primary" onClick={this.doStartGame}>Start Game</Button>
              </Row>
            )}
            {gameStatus !== 'idle' && !!account && (
            <Row style={{margin: "4px 4px 4px 4px"}}>

            <Col offset={0} xs={0} sm={1} md={0} lg={2} xl={4}/>

            <Col offset={0} xs={24} sm={22} md={24} lg={20} xl={16} style={{backgroundColor: '#f0f2f5'}}>
              <Row type="flex" justify="center" style={{ height:"30px", fontSize:"20px", fontWeight:"bold", color: "#005bb2" }}>
                {(readyToScore) ? (
                  'Select a category to score.'
                ) : (readyToRoll) ? (
                  'Select a category, or roll again.'
                ) : (rollStatus === 'rolling') ? (
                  'Waiting for block #'+rollBlock+' ...' 
                ) : (gameStatus === 'ended') ? (
                  'Start another game?' 
                ) : ''}
               {gameStatus !== 'ended' && (
                  <Button type="ghost" size="small" style={{ marginLeft: "8px", marginTop: "2px"}}
                    onClick={this.doAbortGame}>
                    Quit Game
                  </Button>)}
              </Row>
              <Row style={{height: "100%", width: "100%"}}>
              <Col offset={0} xs={24} sm={24} md={24} lg={24} xl={24} style={{borderSize:"1px", borderStyle:"ridge", borderRadius:"4px"}}>
                <Row style={{width: "100%", paddingBottom:"8px", backgroundColor: '#fff'}}>
                  <Col offset={1} span={4}><Statistic title={<span style={{fontSize:"20px"}}>Game</span>} value={gameId} /></Col>
                  <Col span={4}><Statistic title={<span style={{fontSize:"20px"}}>Turn</span>} value={gameTurn} suffix='of 15' /></Col>
                  <Col span={4}><Statistic title={<span style={{fontSize:"20px"}}>Roll</span>} value={gameTurnRoll} suffix='of 3' /></Col>
                  <Col span={4}><Statistic title={<span style={{fontSize:"20px"}}>Score</span>} value={score} /></Col>
                  <Col span={3}><Statistic title={<span style={{fontSize:"20px"}}>Avg</span>} value={score} /></Col>
                  <Col span={4}><Statistic title={<span style={{fontSize:"20px"}}>Time</span>} value={'45:00'} /></Col>
                </Row>
  
                {(gameStatus !== 'ended') ? (
                <Row style={{ width: "100%", height:"72px", paddingTop:"6px", color: "white", backgroundColor:"#002950" }}>
                  <Col span={1}/>
                  <Col span={21}>
                    <Row style={{width: "100%"}}>
                      {roll.map((each, index) => (
                        (each === 1) ? <Col key={index} span={4}>
                          <Icon component={(bankSelect[index]) ? OnOne : OffOne} onClick={() => this.onBankChange(index)}/></Col> :
                        (each === 2) ? <Col key={index} span={4}>
                          <Icon component={(bankSelect[index]) ? OnTwo : OffTwo} onClick={() => this.onBankChange(index)}/></Col> :
                        (each === 3) ? <Col key={index} span={4}>
                          <Icon component={(bankSelect[index]) ? OnThree : OffThree} onClick={() => this.onBankChange(index)}/></Col> :
                        (each === 4) ? <Col key={index} span={4}>
                          <Icon component={(bankSelect[index]) ? OnFour : OffFour} onClick={() => this.onBankChange(index)}/></Col> :
                        (each === 5) ? <Col key={index} span={4}>
                          <Icon component={(bankSelect[index]) ? OnFive : OffFive} onClick={() => this.onBankChange(index)}/></Col> :
                        (each === 6) ? <Col key={index} span={4}>
                          <Icon component={(bankSelect[index]) ? OnSix : OffSix} onClick={() => this.onBankChange(index)}/></Col> :
                        <Col key={index} span={4}><Spin size="large" style={{ paddingTop:"15px", paddingLeft:"12px", color: "white"}}/></Col>
                      ))}
                      <Col offset={1} span={3}>
                        <Button type="ghost" style={{ width: "60px", height:"60px", backgroundColor:"#002950"}}
                          onClick={this.doRollAgain} disabled={!readyToRoll}>
                          <Icon component={(readyToRoll) ? YellowCupRoll : CupRoll} style={{ marginLeft: "-16px"}}/>
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                  <Col span={2}/>
                </Row>
                ) : (
                  <Row type='flex' justify='center' style={{ width: "100%", height:"72px", paddingTop:"16px", color: "white", backgroundColor:"#002950" }}>
                    <Button type="primary" style={{color: "#002950"}} onClick={this.doStartGame}>Start New Game</Button>
                  </Row>
                )}

                <Descriptions size="small" bordered column={{xs:"2", sm:"2", md:"3", lg:"3", xl:"3"}} style={{backgroundColor: "#f0f2f5", color:"#fff"}}>
                  {tally.map((scoreCat, cat) => (
                    <Descriptions.Item key={cat} label={<span style={{fontSize:"17px"}}>{nameOfCategory(cat)}</span>}>
                      {(scoreCat === 255) ? <span style={{fontSize:"24px", color:"#002950"}}>0</span> : 
                      (scoreCat > 0) ? <span style={{fontSize:"24px", color:"#002950"}}>{scoreCat}</span> : 
                      (readyToScore) ? (
                        <Button type="ghost"
                          style={{left:"-6px", width:"57px", marginBottom:"-2px", marginRight:"-18px", height:"38px", backgroundColor: "#f0f2f5", fontSize:"24px", color:"#002950"}}
                          onClick={() => this.doScoreCategory(cat)}>
                          <span style={{marginLeft:"-12px", fontStyle:"italic"}}>{'+'+scoreCategory(cat, bankFilter)}</span>
                        </Button>
                      ) : <span style={{fontSize:"24px", color: "#f0f2f5"}}>000</span>}
                    </Descriptions.Item>
                  ))}
                </Descriptions>

              </Col>
              <Col offset={0} xs={0} sm={0} md={0} lg={0} xl={0}>
                <Row style={{height: "100%", width: "100%"}}>
                  Block B
                </Row>
              </Col>
              </Row>
            </Col>
            <Col offset={0} xs={0} sm={1} md={0} lg={2} xl={4}/>
            </Row>
            )}
          </Content>
        </Layout>
        <Footer>

        </Footer>
      </Layout>
    );
  }
}

App.propTypes = {
  account: PropTypes.string,
  accountError: PropTypes.string,
  contracts: PropTypes.object, 
  gameStatus: PropTypes.string, 
  gameId: PropTypes.string, 
  gameTurn: PropTypes.number, 
  gameTurnRoll: PropTypes.number, 
  rollStatus: PropTypes.string, 
  rollKey: PropTypes.string, 
  rollBlock: PropTypes.number,
  roll: PropTypes.array
}

export default connect((state) => ({
  account: state.account,
  accountError: state.accountError,
  contracts: state.contracts, 
  gameStatus: state.gameStatus, 
  gameId: state.gameId, 
  gameTurn: state.gameTurn, 
  gameTurnRoll: state.gameTurnRoll, 
  rollStatus: state.rollStatus, 
  rollKey: state.rollKey, 
  rollBlock: state.rollBlock,
  roll: state.roll
}))(App);
