import {
  Client, LocalAddress, CryptoUtils, LoomProvider
} from 'loom-js';
import BN from 'bn.js';
import Web3 from 'web3';
import { eventChannel, buffers, END } from 'redux-saga';
const bip39 = require('bip39');

export const VERIFY_BLOCKS = 1;

export const YatzyCoinRinkebyContract = require("./contracts/YatzyCoin.json");
export const YatzyCoinRinkebyAddress = '0xe75eB9FAD63422283f0759230B1AE635efeC101e';
export const YatzyCoinRinkebyGenesis = 4860556;

export const YatzyCoinPlasmaContract = require("./contracts/YatzyCoinPlasma.json");
export const YatzyCoinPlasmaAddress = '0x6aF05d36142C0d9c6B246E38389d28C96711E153';
export const YatzyCoinPlasmaGenesis = 7475886;

export const BlockDiceContract = require("./contracts/BlockDice.json");
export const BlockDiceAddress = '0x4b5D49a47a2031724Ad990C4D74461BC94E3db42';
export const BlockDiceGenesis = 7502293;

export const BlockDice65Turn3Contract = require("./contracts/BlockDice65Turn3.json");
export const BlockDice65Turn3Address = '0xFC1C54558586D42c2D584476f83862BeF02F569C';
export const BlockDice65Turn3Genesis = 7504096;

export const YatzyGameContract = require("./contracts/DiceGameYatzy.json");
export const YatzyGameAddress = '0xA0D58ACBD4526371E182068F33d3493Df387585c';
export const YatzyGameGenesis = 7522730;

export const YatzyCoinGameContract = require("./contracts/CoinGameYatzy.json");
export const YatzyCoinGameAddress = '0x294C5D489Fc84F82FD21cd8573988DB126ff219A';
export const YatzyCoinGameGenesis = 7522803;

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

let _instance = undefined;
export const getContracts = (mnemonic) => {
  if (!mnemonic) _instance = null;
  else if (!_instance || _instance.mnemonic !== mnemonic)
    _instance = new ExtdevYatsyContracts(mnemonic);
  return _instance;
}

class ExtdevYatsyContracts {

  constructor(mnemonic) {
    this.client = new Client(
      'extdev-plasma-us1', 
      'ws://extdev-plasma-us1.dappchains.com:80/websocket', 
      'ws://extdev-plasma-us1.dappchains.com:80/queryws'
    );
    this.client.on('error', (msg) => console.error(
      'Error on connect to extdev-plasma-us1 client, msg: ', msg));
    this.mnemonic = mnemonic;
    const seed = (new Uint8Array(bip39.mnemonicToSeedSync(this.mnemonic))).slice(0,32);
    console.log('seed: ', seed);
    this.privateKey = CryptoUtils.generatePrivateKeyFromSeed(seed);
    this.publicKey = CryptoUtils.publicKeyFromPrivateKey(this.privateKey);
    this.userAddress = LocalAddress.fromPublicKey(this.publicKey).toChecksumString();
    console.log('this.userAddress: ', this.userAddress);
    this.loomWeb3 = new Web3(new LoomProvider(this.client, this.privateKey));
    this.yatzyGame = new this.loomWeb3.eth.Contract(
      YatzyGameContract.abi, 
      YatzyGameAddress, {from: this.userAddress}
    );
    this.diceTurn = new this.loomWeb3.eth.Contract(
      BlockDice65Turn3Contract.abi, 
      BlockDice65Turn3Address, {from: this.userAddress}
    );
    this.coinGame = new this.loomWeb3.eth.Contract(
      YatzyCoinGameContract.abi, 
      YatzyCoinGameAddress, {from: this.userAddress}
    );
    this.plasmaCoin = new this.loomWeb3.eth.Contract(
      YatzyCoinPlasmaContract.abi, 
      YatzyCoinPlasmaAddress, {from: this.userAddress}
    );
  }

  mnemonic = () => this.mnemonic;
  account = () => this.userAddress;
  web3 = () => this.loomWeb3;
  yatzyGame = () => this.yatzyGame;
  genKey = () => this.loomWeb3.utils.soliditySha3 (this.userAddress, Date.now());
  hashKey = (key) => this.loomWeb3.utils.soliditySha3 (key);
  getBalance = async () => {
    let balance;
    try{
      balance = await this.plasmaCoin.methods.balanceOf(this.userAddress).call({from: this.userAddress});
      balance = balance.toString();
      console.log('getBalance balance:', balance);
    } catch(e) { console.log('getBalance caught e:', e)}
    return balance;
  }
  getBank = async (key) => {
    let bank;
    try{
      bank = await this.yatzyGame.methods.getTurnBank(key).call({from: this.userAddress});
      if (!!bank && !!bank.length) 
        bank = bank.map((each) => parseInt(each.toString(), 10));
      console.log('getBank bank:', bank.join(' '));
    } catch(e) { console.log('getBank caught e:', e)}
    return bank;
  }
  getRoll = async (key) => {
    let roll = [];
    try{
      roll = await this.yatzyGame.methods.getTurnRoll(key).call({from: this.userAddress});
      if (!!roll && !!roll.length) 
        roll = roll.map((each) => parseInt(each.toString(), 10) + 1);
      console.log('getRoll roll:', roll.join(' '));
    } catch(e) { console.log('getRoll caught e:', e)}
    return roll;
  }
  sleepUntilBank = async (key, blockNumber) => {
    await this.sleepUntilBlock(blockNumber);
    const bank = await this.getBank(key);
    return bank;
  }
  sleepUntilRoll = async (key, blockNumber) => {
    await this.sleepUntilBlock(blockNumber);
    const roll = await this.getRoll(key);
    return roll;
  }
  sleepUntilBlock = async (blockNumber) => {
    try{
      let _blockNumber = 0;
      while (_blockNumber <= blockNumber) {
        await sleep(2000);
        _blockNumber = await this.loomWeb3.eth.getBlockNumber();
      }
    } catch(e) { console.log('sleepUntilBlock caught e:', e)}
  }
}

const sleep = async (time) => {
  return new Promise(resolve => setTimeout(() => resolve(), time));
}

export const genMnemonic = () => bip39.generateMnemonic();

export const testMnemonic = (mnemonic) => {
  let valid = false;
  try {
    valid = bip39.validateMnemonic(mnemonic);
  } catch (e) {
    console.error('testMnemonic fail, error:', e);
    return false;
  }
  return valid;
};

export const soloSeatTx = () => ({
  contract: 'coinGame', 
  method: 'soloSeat', 
  args: []
});

export const registerGameTx = ({tableId, seat, gameId}) => ({
  contract: 'coinGame', 
  method: 'registerGame', 
  args: [tableId, seat, gameId]
});

export const claimGameTx = ({tableId, seat, gameId}) => ({
  contract: 'coinGame', 
  method: 'claimGame', 
  args: [tableId, seat, gameId]
});

export const startGameTx = ({ hash }) => ({
  contract: 'yatzyGame', 
  method: 'startGame', 
  args: [hash, VERIFY_BLOCKS]
});

export const continueGameTx = ({ key, nextHash, bankFilter, cat }) => ({
  contract: 'yatzyGame', 
  method: 'continueGame', 
  args: [key, nextHash, bankFilter, cat]
});

export const abortGameTx = () => ({
  contract: 'yatzyGame', 
  method: 'abortGame', 
  args: []
});

export const saveAccountState = (account, state) => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(`YATZY_UI/account/${account}`, serialized);
  } catch (e) {
    console.error('Account cache store fail: error', e);
  }
};

export const loadAccountState = (account) => {
  try {
    const serialized = localStorage.getItem(`YATZY_UI/account/${account}`);
    if (serialized === null) return undefined;
    else return JSON.parse(serialized);
  } catch (e) {
    console.error('Cached account retreival fail: error', e);
    return undefined;
  }
};

export const createBlockUpdateChannel = (web3) => eventChannel(emitter => {
  const blockSub = web3.eth.subscribe('newBlockHeaders');
  const onBlockUpdate = (block) => {
    emitter({block});
  };
  blockSub.on("data", onBlockUpdate);
  return () => blockSub.unsubscribe();
}, buffers.sliding(2));

export const createTransactionChannel = (tx, params) => eventChannel(emitter => {
  let txSub;
  var hash;
  try { 
    txSub = tx.send(params);
    txSub.on('transactionHash', (_hash) => {
      hash = _hash; 
      //console.log('Hash: '+hash)
      emitter({type: 'hash', hash});
    });
    txSub.on('receipt', (receipt) => emitter({type: 'receipt', receipt, hash}));
    txSub.on('confirmation', (count, receipt) => {
      emitter({type: 'confirmation', receipt, count, hash});
      if (count >= 12) emitter(END);
    });
    txSub.on('error', (error) => {
      emitter({type: 'error', error, hash});
      emitter(END);
    });
  } catch(error) {
    emitter({type: 'cancel', error});
    emitter(END);
  }
  return () => {}
}, buffers.sliding(2));

export const getPastEvents = async (contract, event, options) => 
  await contract.getPastEvents(event, options);

export const cleanEvent = (e) => ({
  ...e,
  raw: null,
  returnValues: 
    (e.event === 'PlayerSit') ? {
      account: e.returnValues.account.toString(),
      tableId: e.returnValues.tableId.toString(),
      seat: e.returnValues.seat.toString(),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'PlayerGame') ? {
      account: e.returnValues.account.toString(),
      tableId: e.returnValues.tableId.toString(),
      seat: e.returnValues.seat.toString(),
      gameId: e.returnValues.gameId.toString(),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'ScoreReward') ? {
      account: e.returnValues.account.toString(),
      tableId: e.returnValues.tableId.toString(),
      seat: e.returnValues.seat.toString(),
      gameId: e.returnValues.gameId.toString(),
      score:parseInt(e.returnValues.score,10),
      reward: parseInt(e.returnValues.reward,10),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'GameStarted') ? {
      account: e.returnValues.account.toString(),
      gameId: e.returnValues.gameId.toString(),
      verify: parseInt(e.returnValues.verify,10),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'GameContinued') ? {
      account: e.returnValues.account.toString(),
      gameId: e.returnValues.gameId.toString(),
      turn: parseInt(e.returnValues.turn.toString(),10),
      score: parseInt(e.returnValues.score.toString(),10),
      tally: e.returnValues.tally.map((each) => parseInt(each.toString(),10)),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'GameEnded') ? {
      account: e.returnValues.account.toString(),
      gameId: e.returnValues.gameId.toString(),
      score: parseInt(e.returnValues.score.toString(),10),
      tally: e.returnValues.tally.map((each) => parseInt(each.toString(),10)),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'TurnContinued') ? {
      account: e.returnValues.account.toString(),
      bank: e.returnValues.bank.map((each) => parseInt(each.toString(),10)),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : {}
});

export const mapEventToState = (e, state) => {
  if (!e || !state) return;
  if (!e.removed && !state.eventLog[e.id]) {
    e.account = state.account;
    state.eventLog[e.id] = e;
    state.events.unshift(e.id);//descending order
  } else if (!e.removed && !!state.eventLog[e.id]) {
    return;//already processed event
  } else if (e.removed && !state.eventLog[e.id]) {
    return;//already undid and removed event
  } else if (e.removed && !!state.eventLog[e.id]) {
    const alreadyRemoved = !!state.eventLog[e.id].removed;//defensive
    state.events = state.events.filter((each) => each !== e.id);
    state.eventLog[e.id] = null;
    if (alreadyRemoved) return;//never want to process remove more than once
  }
  if (e.event === 'PlayerSit') {
    state.tableId = e.returnValues.tableId;
    state.seat = e.returnValues.seat;
  }

}

export const nameOfCategory = (category) =>  (
    (category === 0) ? 'Ones (Sum 1s)': 
    (category === 1) ? 'Twos (Sum 2s)': 
    (category === 2) ? 'Threes (Sum 3s)': 
    (category === 3) ? 'Fours (Sum 4s)': 
    (category === 4) ? 'Fives (Sum 5s)': 
    (category === 5) ? 'Sixes (Sum 6s)': 
    (category === 6) ? '1-Pair (Sum pair)' :
    (category === 7) ? '2-Pair (Sum pairs)' :
    (category === 8) ? '3-Same (Sum three)' :
    (category === 9) ? '4-Same (Sum four)' :
    (category === 10) ? 'Low-Straight (Sum)' :
    (category === 11) ? 'High-Straight (Sum)' :
    (category === 12) ? 'Full-House (Sum)' :
    (category === 13) ? 'Yatzy (50pts)' : 'Chance (Sum)'
);

export const scoreCategory = (category, bank) =>  (
    (category === 0) ? bank[0] ://1s
    (category === 1) ? bank[1] * 2 ://2s
    (category === 2) ? bank[2] * 3 ://3s
    (category === 3) ? bank[3] * 4 ://4s
    (category === 4) ? bank[4] * 5 ://5s
    (category === 5) ? bank[5] * 6 ://6s
    (category === 6) ? (//highest pair
        (bank[5] > 1) ? 12 : (bank[4] > 1) ? 10 : (bank[3] > 1) ? 8 :
        (bank[2] > 1) ? 6 : (bank[1] > 1) ? 4 : (bank[0] > 1) ? 2 : 0) :
    (category === 7) ? (//2 pair
        (bank[5] > 1 && bank[4] > 1) ? 22 :
        (bank[5] > 1 && bank[3] > 1) ? 20 :
        ((bank[5] > 1 && bank[2] > 1) || (bank[4] > 1 && bank[3] > 1)) ? 18 :
        ((bank[5] > 1 && bank[1] > 1) || (bank[4] > 1 && bank[2] > 1)) ? 16 :
        ((bank[5] > 1 && bank[0] > 1) || (bank[4] > 1 && bank[1] > 1) 
            || (bank[3] > 1 && bank[2] > 1)) ? 14 :
        ((bank[4] > 1 && bank[0] > 1) || (bank[3] > 1 && bank[1] > 1)) ? 12 :
        ((bank[3] > 1 && bank[0] > 1) || (bank[2] > 1 && bank[1] > 1)) ? 10 :
        (bank[2] > 1 && bank[0] > 1) ? 8 :
        (bank[1] > 1 && bank[0] > 1) ? 6 : 0) :
    (category === 8) ? (//triple
        (bank[5] > 2) ? 18 : (bank[4] > 2) ? 15 : (bank[3] > 2) ? 12 :
        (bank[2] > 2) ? 9 : (bank[1] > 2) ? 6 : (bank[0] > 2) ? 3 : 0) :
    (category === 9) ? (//quad
        (bank[5] > 3) ? 24 : (bank[4] > 3) ? 20 : (bank[3] > 3) ? 16 :
        (bank[2] > 3) ? 12 : (bank[1] > 3) ? 8 : (bank[0] > 3) ? 4 : 0) :
    (category === 10) ? (//low straight
        (bank[4] === 1 && bank[3] === 1 && bank[2] === 1 && 
            bank[1] === 1 && bank[0] === 1) ? 15 : 0) :
    (category === 11) ? (//high straight
        (bank[5] === 1 && bank[4] === 1 && bank[3] === 1 && 
            bank[2] === 1 && bank[1] === 1) ? 20 : 0) :
    (category === 12) ? (//full house
        (bank[5] === 3) ? (
            (bank[4] === 2) ? 28 : (bank[3] === 2) ? 26 : (bank[2] === 2) ? 24 :
            (bank[1] === 2) ? 22 : (bank[0] === 2) ? 20 : 0) :
        (bank[4] === 3) ? (
            (bank[5] === 2) ? 27 : (bank[3] === 2) ? 23 : (bank[2] === 2) ? 21 :
            (bank[1] === 2) ? 19 : (bank[0] === 2) ? 17 : 0) :
        (bank[3] === 3) ? (
            (bank[5] === 2) ? 24 : (bank[4] === 2) ? 22 : (bank[2] === 2) ? 18 :
            (bank[1] === 2) ? 16 : (bank[0] === 2) ? 14 : 0) :
        (bank[2] === 3) ? (
            (bank[5] === 2) ? 21 : (bank[4] === 2) ? 19 : (bank[3] === 2) ? 17 :
            (bank[1] === 2) ? 13 : (bank[0] === 2) ? 11 : 0) :
        (bank[1] === 3) ? (
            (bank[5] === 2) ? 18 : (bank[4] === 2) ? 16 : (bank[3] === 2) ? 14 :
            (bank[2] === 2) ? 12 : (bank[0] === 2) ? 8 : 0) :
        (bank[0] === 3) ? (
            (bank[5] === 2) ? 15 :  (bank[4] === 2) ? 13 : (bank[3] === 2) ? 11 :
            (bank[2] === 2) ? 9 : (bank[1] === 2) ? 7 : 0) : 0) :
    (category === 13) ? (//yatzy
        (bank[5] === 5 || bank[4] === 5 || bank[3] === 5 || bank[2] === 5 || 
            bank[1] === 5 || bank[0] === 5) ? 50 : 0) :
    (category === 14) ? (//chance
        (bank[5] * 6) + (bank[4] * 5) + (bank[3] * 4) + (bank[2] * 3) + 
            (bank[1] * 2) + (bank[0] * 1)) : 0
);

/* ACTiONS */
export const LOGIN_ACCOUNT = 'YATZY_UI/LOGIN_ACCOUNT';
export const LOGOUT_ACCOUNT = 'YATZY_UI/LOGOUT_ACCOUNT';
export const ACCOUNT_LOGIN = 'YATZY_UI/ACCOUNT_LOGIN';
export const ACCOUNT_MOUNTED = 'YATZY_UI/ACCOUNT_MOUNTED';
export const ACCOUNT_ERROR = 'YATZY_UI/ACCOUNT_ERROR';
export const BLOCK_UPDATE = 'YATZY_UI/BLOCK_UPDATE';
export const CONTRACT_EVENT = 'YATZY_UI/CONTRACT_EVENT';
export const SEND_TX = 'YATZY_UI/SEND_TX';
export const TX_UPDATE = 'YATZY_UI/TX_UPDATE';
export const UI_CHANGE_DRAWER_VIEW = 'YATZY_UI/UI_CHANGE_DRAWER_VIEW';
export const UI_TOGGLE_CREATE_MODAL = 'YATZY_UI/UI_TOGGLE_CREATE_MODAL';

export const START_GAME = 'YATZY_UI/START_GAME';
export const ABORT_GAME = 'YATZY_UI/ABORT_GAME';
export const CONTINUE_GAME = 'YATZY_UI/CONTINUE_GAME';
export const ROLL_TRANSLATED = 'YATZY_UI/ROLL_TRANSLATED';
export const UPDATE_BALANCE = 'YATZY_UI/UPDATE_BALANCE';


export default getContracts;


/* old destroy me
export const BlockDiceContract = require("./contracts/BlockDice.json");
export const BlockDiceAddress = '0x3bcfD0401FceE05bb0E521A17225e66bC25FcC8e';
export const BlockDiceGenesis = 7476049;

export const BlockDiceTestContract = require("./contracts/BlockDiceTest.json");
export const BlockDiceTestAddress = '0x45227296cC79C93cF81AC9138a7645c9f763AEAe';
export const BlockDiceTestGenesis = 7501876;

export const BlockDice65Turn3Contract = require("./contracts/BlockDice65Turn3.json");
export const BlockDice65Turn3Address = '0xbBA9Ce0Ef25aDd24eF4EFDB1FA9A0d672A78A6De';
export const BlockDice65Turn3Genesis = 7491518;

export const YatzyGameContract = require("./contracts/DiceGameYatzy.json");
export const YatzyGameContractAddress = '0x51b9A8634498aB2612079dEb7F158ce77754C42E';
export const YatzyGameContractGenesis = 7491562;

export const BlockDice65Turn3Contract = require("./contracts/BlockDice65Turn3.json");
export const BlockDice65Turn3Address = '0x0b45289B860C3d7957FB16eA3DbBa57dA76A3C6B';
export const BlockDice65Turn3Genesis = 7503196;

export const YatzyGameContract = require("./contracts/DiceGameYatzy.json");
export const YatzyGameContractAddress = '0xAC7Ff5CBd94f8C30e45c396e2FC598a03e118884';
export const YatzyGameContractGenesis = 7503220;

export const YatzyGameContract = require("./contracts/DiceGameYatzy.json");
export const YatzyGameAddress = '0x6B3e6592B8aFD9d3EC00afCC3C6A0c8AE68802D5';
export const YatzyGameGenesis = 7504111;
*/