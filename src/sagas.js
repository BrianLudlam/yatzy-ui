import { call, fork, put, select, take, takeLatest, takeEvery/*, cancel, cancelled*/ } from 'redux-saga/effects';
//import { eventChannel, buffers, END } from 'redux-saga';
//import { cacheBlockhash, getBlockhashSet, blockhashCacheThreshold } from "./firebase";
import { LOGIN_ACCOUNT, SEND_TX, BLOCK_UPDATE, ACCOUNT_LOGIN, YatzyGameGenesis, 
         cleanEvent, mapEventToState, createBlockUpdateChannel, createTransactionChannel, 
         loadAccountState, saveAccountState, getPastEvents, accountTopic,
         getContracts, testMnemonic, soloSeatTx, registerGameTx, claimGameTx
       } from './ExtdevYatsyContracts';

import { accountLogin, accountError, accountMounted, rollTranslated,
         blockUpdate, contractEvent, txUpdate, sendTx, updateBalance
       } from './actions';

/*
import { infuraConfig } from './infuraConfig';

import { firebase } from '@firebase/app';
import '@firebase/database';
import { firebaseConfig } from './firebaseConfig';

import { writeNodeFile, writeItemFile, writeStepFile, readIPFile, hashNodeFile } from './ipfs';
import bs58 from 'bs58';
*/

function* loginAccount({mnemonic}) {
  if (!mnemonic || !testMnemonic(mnemonic)) return;
  let contracts = undefined;
  let account = undefined;
  try {
    contracts = yield call(getContracts, mnemonic);
    console.log('loginAccount contracts: ', contracts)
    if (!!contracts && !!contracts.account) {
      account = yield call(contracts.account);
      console.log('loginAccount account: '+ account)
    
    } else yield put(accountError({error: 'loginAccount Error contracts: '+contracts}));
    
    if (!!account) {
      const balance = yield call(contracts.getBalance);
      yield put(accountLogin({account, balance, contracts}));

    } else yield put(accountError({error: 'loginAccount Error account: '+account}));

  } catch (e) { 
    contracts = undefined;
    account = undefined;
    console.log('loginAccount Error caught: ',e);
    yield put(accountError({error: 'loginAccount Error caught: '+e}));
  }
  
}
      
function* initAccountEvents() {
  const { contracts, account } = yield select();
  if (!contracts || !account) return;
  const web3 = contracts.web3();
  if (!web3) return;

  //const prevState = loadAccountState(account);
  //console.log('trying prevState: ', prevState);
  let state = {
    account,
    lastBlock: YatzyGameGenesis, 
    events: [], 
    eventLog: {}
  } /*: {
    ...prevState, account,
    //start from 12 blocks before last to recover from any reorg changes
    lastBlock: (prevState.lastBlock > 12) ? prevState.lastBlock - 12 : prevState.lastBlock
  };*/
  let newEvents;
  let caughtUp = false;
  while (!caughtUp) {
    const _block = yield call(web3.eth.getBlock, 'latest');
    _block.number = parseInt(_block.blockNumber, 16);
    if (!_block)  return;
    if (state.lastBlock === _block.number) {
      state.block = _block;
      caughtUp = true;
    } else {
      console.log('initAccountEvents catching up with block: ', _block.number);
      newEvents = yield* getNewEvents(state.lastBlock+1, _block.number);
      if (!!newEvents && !!newEvents.length) {
        for (let i=0; i<newEvents.length; i++) {
          const event = cleanEvent(newEvents[i]);
          mapEventToState(event, state);
          //yield* updateForEvent(event);
        }
      }
      state.lastBlock = _block.number;
    }
  }

  yield put(blockUpdate(state));
  yield fork(watchForBlockUpdates);
  console.log('accountMounted state: ', state);
  yield put(accountMounted(state));

  if (!state.tableId || !state.seat.toString()) {
    console.log('initAccountEvents soloSeatTx...');
    const action = sendTx(soloSeatTx());
    yield put(action);
  }else console.log('initAccountEvents already seated at table '+state.tableId+' seat '+state.seat);
}

function* getNewEvents(fromBlock, toBlock) {
  const { contracts, account, eventLog } = yield select();
  if (!contracts || !account || !eventLog) return;
  const web3 = contracts.web3();
  const yatzyGame = contracts.yatzyGame;
  const diceTurn = contracts.diceTurn;
  const coinGame = contracts.coinGame;
  if (!web3 || !yatzyGame) return;
  console.log('getNewEvents fromBlock: '+fromBlock+' toBLock: '+toBlock);
  let newEvents = [];
  const addEvent = (e) => {
    if (!e || !e.id) return;
    if (!eventLog[e.id] || (e.removed && !!eventLog[e.id])) {
      //delay removing removed events until after state mapping, which is delayed for ordered events
      newEvents.push(e);
    }
  }
  //console.log('getNewEvents account: ', account);
  const accountTopic = web3.eth.abi.encodeParameter('address', account);
  const topics = [null, accountTopic, null, null];
  const filter = { account };
  //console.log('getNewEvents topics: ', topics);
  try {
    let pastEvents = yield call(getPastEvents, yatzyGame, 'GameStarted', {
      filter,
      fromBlock, 
      toBlock
    }); 
    if (!!pastEvents.length) console.log('getNewEvents GameStarted: ', pastEvents);
    pastEvents.forEach(addEvent);

    pastEvents = yield call(getPastEvents, yatzyGame, 'GameContinued', {
      filter,
      fromBlock, 
      toBlock
    }); 
    if (!!pastEvents.length) console.log('getNewEvents GameContinued: ', pastEvents);
    pastEvents.forEach(addEvent);

    pastEvents = yield call(getPastEvents, yatzyGame, 'GameEnded', {
      filter,
      fromBlock, 
      toBlock
    }); 
    if (!!pastEvents.length) console.log('getNewEvents GameEnded: ', pastEvents);
    pastEvents.forEach(addEvent);

    pastEvents = yield call(getPastEvents, diceTurn, 'TurnContinued', {
      filter,
      fromBlock, 
      toBlock
    }); 
    if (!!pastEvents.length) console.log('getNewEvents TurnContinued: ', pastEvents);
    pastEvents.forEach(addEvent);

    pastEvents = yield call(getPastEvents, coinGame, 'PlayerSit', {
      filter,
      fromBlock, 
      toBlock
    }); 
    if (!!pastEvents.length) console.log('getNewEvents PlayerSit: ', pastEvents);
    pastEvents.forEach(addEvent);

    pastEvents = yield call(getPastEvents, coinGame, 'PlayerGame', {
      filter,
      fromBlock, 
      toBlock
    }); 
    if (!!pastEvents.length) console.log('getNewEvents PlayerGame: ', pastEvents);
    pastEvents.forEach(addEvent);

    pastEvents = yield call(getPastEvents, coinGame, 'ScoreReward', {
      filter,
      fromBlock, 
      toBlock
    }); 
    if (!!pastEvents.length) console.log('getNewEvents ScoreReward: ', pastEvents);
    pastEvents.forEach(addEvent);

  } catch (e) { console.log('getNewEvents RPC Error caught: ',e); }

  if (!!newEvents.length) {
    newEvents.sort((a,b) => ((a.blockNumber === b.blockNumber) ?
      a.transactionIndex - b.transactionIndex : a.blockNumber - b.blockNumber));
  }

  return newEvents;
}

function* watchForBlockUpdates() { 
  const { contracts } = yield select();
  if (!contracts) return;
  const web3 = contracts.web3();
  if (!web3) return;
  const blockUpdateChannel = yield call(createBlockUpdateChannel, web3);
  try {
    while (true) {
      const { block } = yield take(blockUpdateChannel);
      const { lastBlock } = yield select();
      if (!!block) {
        block.number = parseInt(block.blockNumber, 16);
        /*
        const mnemonic = contracts.mnemonic;
        if (!!account) {
          const { events, eventLog, nodes, nodeItems, nodeSteps, lastBlock } = yield select();
          yield fork(saveAccountState, account, { events, eventLog, nodes, 
            nodeItems, nodeSteps, lastBlock });
        }
        */
        yield put(blockUpdate({block, lastBlock}));
      }
    }
  } catch (e) { console.log('Block Update Channel Error caught: ',e);
  } finally {
    blockUpdateChannel.close();
  }
}

function* updateBlockEvents({block, lastBlock}) {
  if (block.number === lastBlock) return;
  const newEvents = yield* getNewEvents(
    lastBlock+1, 
    block.number
  );
  if (!!newEvents && !!newEvents.length) {
    for (let i=0; i<newEvents.length; i++) {
      const event = newEvents[i]; 
      yield put(contractEvent({event}));
      yield* updateForEvent(event);
    }
  }
  const { contracts } = yield select();
  const balance = yield call(contracts.getBalance);
  yield put(updateBalance({balance}));
}

function* updateForEvent(e) {
  const { rollKey, tableId, seat } = yield select();
  if (e.event === 'GameStarted' || e.event === 'GameContinued' || e.event === 'TurnContinued') {
    yield fork(waitForRollBlock, rollKey);
  }

  if (e.event === 'GameStarted') {
    const gameId = e.returnValues.gameId;
    if (!!tableId && !!seat) {
      console.log('updateForEvent registering game ID: '+gameId+' at table '+tableId+' seat '+seat);
      const action = sendTx(registerGameTx({tableId, seat, gameId}));
      yield put(action);
    } else console.error('updateForEvent registering game fail!!, game ID: '+gameId+' at table '+tableId+' seat '+seat);
  
  } else if (e.event === 'GameEnded') {
    const gameId = e.returnValues.gameId;
    if (!!tableId && !!seat) {
      console.log('updateForEvent claiming game ID: '+gameId+' at table '+tableId+' seat '+seat);
      const action = sendTx(claimGameTx({tableId, seat, gameId}));
      yield put(action);
    } else console.error('updateForEvent claiming game fail!!, game ID: '+gameId+' at table '+tableId+' seat '+seat);
  }

}

function* waitForRollBlock() {
  const { contracts, rollStatus, rollKey, rollBlock } = yield select();
  if (rollStatus === 'rolling' && !!rollKey && !!rollBlock) {
    console.log('waitForRollBlock '+ rollBlock);
    let roll = [];
    try {
      roll = yield call(contracts.sleepUntilRoll, rollKey, rollBlock);
    } catch (e) { console.log('waitForRollBlock caught: ',e); 
    } finally {
      console.log('waitForRollBlock roll: ', roll);
      const checkState = yield select();
      if (checkState.rollStatus === 'rolling' && checkState.rollKey === rollKey && 
          checkState.rollBlock === rollBlock) {
        yield put(rollTranslated({roll}));
      }
    }
  }
}

function* watchTransaction({contract, method, args}) {
  const { contracts, account } = yield select();
  if (!contracts || !account) return;
  const web3 = contracts.web3();
  const _contract = contracts[contract];
  if (!web3 || !_contract) return;
  let txCall;
  if (!!args && !!args.length) {
    txCall = yield call(_contract.methods[method], ...args);
  }else {
    txCall = yield call(_contract.methods[method]);
  }
  if (!txCall) return;
  const params = {from: account};
  const transactionChannel = yield call(createTransactionChannel, txCall, params);
  try {
    while (true) {
      const tx = yield take(transactionChannel);
      //console.log('Incoming tx: ', tx)
      const { account } = yield select();
      if (params.from !== account.toLowerCase()) break;//defensive for account changes during tx lifetime
      tx.title = method;
      tx.args = args;
      yield put(txUpdate({tx}));
    }
  } finally {
    transactionChannel.close();
  }
}

export default function* rootSaga() {
  yield takeLatest(LOGIN_ACCOUNT, loginAccount);
  yield takeLatest(ACCOUNT_LOGIN, initAccountEvents);
  yield takeEvery(BLOCK_UPDATE, updateBlockEvents);
  yield takeEvery(SEND_TX, watchTransaction);
}