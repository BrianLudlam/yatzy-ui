import produce from 'immer';
import { LOGIN_ACCOUNT, LOGOUT_ACCOUNT, ACCOUNT_LOGIN, ACCOUNT_MOUNTED, 
         TX_UPDATE, BLOCK_UPDATE, CONTRACT_EVENT, UI_CHANGE_DRAWER_VIEW, 
         START_GAME, ABORT_GAME, CONTINUE_GAME, UI_TOGGLE_CREATE_MODAL, 
         getContracts, cleanEvent, mapEventToState, ROLL_TRANSLATED, VERIFY_BLOCKS,
         UPDATE_BALANCE
       } from './ExtdevYatsyContracts';

export const initialState = {
  //cachebase: undefined,
  contracts: undefined,
  network: undefined,
  block: undefined,
  loadingAccount: false,
  mountingAccount: false,
  account: '',
  balance: '',
  accountError: '',
  lastBlock: 0,
  txs: [],
  txLog: {},
  events: [],
  eventLog: {},
  newEventCount: 0,
  newTxCount: 0,
  uiRightDrawerOpen: false,
  uiRightDrawerView: 'account',
  uiCreateModalOpen: false,
  uiCreateModalData: undefined,

  tableId: undefined,
  seat: undefined,
  gameStatus: 'idle',
  gameId: undefined,
  gameTally: undefined,
  gameScore: 0,
  gameTurn: 0,
  gameTurnRoll: 0,
  rollStatus: 'idle',
  rollKey: undefined,
  rollBlock: undefined,
  roll: [0,0,0,0,0]
};

const clearAccountState = (state) => {
  state.contracts = undefined;
  state.network = undefined;
  state.block = undefined;
	state.account = '';
  state.balance = '';
  state.accountError = '';
  state.lastBlock = 0;
  state.txs = [];
  state.txLog = {};
  state.events = [];
  state.eventLog = {};
  state.newEventCount = 0;
  state.newTxCount = 0;
  state.uiRightDrawerOpen = false;
  state.uiRightDrawerView = 'account';
  state.uiCreateModalOpen = false;
  state.uiCreateModalData = undefined;

  state.tableId = undefined;
  state.seat = undefined;
  state.gameStatus = 'idle';
  state.gameId = undefined;
  state.gameTally = undefined;
  state.gameScore = 0;
  state.gameTurn = 0;
  state.gameTurnRoll = 0;
  state.rollStatus = 'idle';
  state.rollKey = undefined;
  state.rollBlock = undefined;
  state.roll = [0,0,0,0,0];
}

const appReducer = (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {

      case LOGIN_ACCOUNT:
        clearAccountState(draft);
        draft.loadingAccount = true;
        draft.mountingAccount = false;
        draft.accountError = "";
        break;

      case LOGOUT_ACCOUNT:
        clearAccountState(draft);
        draft.loadingAccount = false;
        draft.mountingAccount = false;
        draft.accountError = "";
        try {
          getContracts('');
        } catch (e) { 
          console.log('logoutAccount Error caught: ',e);
        }
        break;

      case ACCOUNT_LOGIN:
        if (!!action.account) {
          draft.contracts = action.contracts;
          draft.account = action.account;
          draft.balance = action.balance;
          draft.accountError = "";
        } else {
          draft.accountError = "Please select an Account.";
        }
        draft.loadingAccount = false;
        draft.mountingAccount = true;
        break;

      case ACCOUNT_MOUNTED:
        draft.events = action.events;
        draft.eventLog = action.eventLog;
        if (!!action.tableId) {
          draft.tableId = action.tableId;
          draft.seat = action.seat;
        }
        
        draft.lastBlock = action.lastBlock;
        draft.mountingAccount = false;
        break;

      case BLOCK_UPDATE:
      	draft.block = action.block;
      	draft.lastBlock = action.block.number;
        break;

      case UPDATE_BALANCE:
        draft.balance = action.balance;
        break;

      case TX_UPDATE:
  			if (!action.tx) break;
        console.log('tx: ',action.tx)
	      if (action.tx.type === 'hash' && !draft.txLog[action.tx.hash]) {
          draft.newTxCount += 1;
	      	draft.txLog[action.tx.hash] = {
	      		transactionHash: action.tx.hash, 
	      		confirmCount: 0, 
	      		status: true,
	      		title: action.tx.title
	      	};
	      	draft.txs.unshift(action.tx.hash);
	      } else if (action.tx.type === 'receipt') {
	      	draft.txLog[action.tx.receipt.transactionHash] = {
	      		...action.tx.receipt, 
	      		confirmCount: 1,
	      		title: action.tx.title
	      	};
	      } else if (action.tx.type === 'confirmation') {
	      	draft.txLog[action.tx.receipt.transactionHash] = {
	      		...action.tx.receipt, 
	      		confirmCount: action.tx.count,
	      		title: action.tx.title
	      	};
	      } else if (action.tx.type === 'error' || action.tx.type === 'cancel') {
	      	if (action.tx.type === 'error' && !!action.tx.hash && !!draft.txLog[action.tx.hash]) {
            draft.txLog[action.tx.hash].confirmCount = 0;
            draft.txLog[action.tx.hash].status = false;
          }
	      }
        break;

      case UI_CHANGE_DRAWER_VIEW:
        if (action.open) {
          draft.uiRightDrawerView = (action.view === 'events') ? 'events' : 
            (action.view === 'txs') ? 'txs' : 'account';
          draft.uiRightDrawerOpen = true;
          if (action.view === 'events') draft.newEventCount = 0;
          else if (action.view === 'txs') draft.newTxCount = 0;
        } else draft.uiRightDrawerOpen = false;
        break;

      case UI_TOGGLE_CREATE_MODAL:
        if (action.open) {
          draft.uiCreateModalOpen = action.open;
          draft.uiCreateModalData = action.data;
        } else {
          draft.uiCreateModalOpen = false;
          draft.uiCreateModalData = undefined;
        } 
        break;

      case CONTRACT_EVENT:
        if (!action.event || !action.event.id) break;
        const e = cleanEvent(action.event);
        mapEventToState(e, draft);
        draft.newEventCount += 1;
        if (e.event === 'GameStarted') {
          draft.gameStatus = 'started';
          draft.gameId = e.returnValues.gameId;
          draft.rollStatus = 'rolling';
          draft.rollBlock = e.blockNumber + VERIFY_BLOCKS;
          
        } else if (e.event === 'TurnContinued') {
          draft.gameStatus = 'continued';
          draft.rollStatus = 'rolling';
          draft.gameTurnRoll += 1;
          draft.rollBlock = e.blockNumber + VERIFY_BLOCKS;

        } else if (e.event === 'GameContinued') {
          draft.gameStatus = 'continued';
          draft.gameTally = e.returnValues.tally;
          draft.gameScore = e.returnValues.score;
          draft.gameTurn += 1;
          draft.gameTurnRoll = 1;
          draft.rollStatus = 'rolling';
          draft.rollBlock = e.blockNumber + VERIFY_BLOCKS;

        } else if (e.event === 'GameEnded') {
          draft.gameStatus = 'ended';
          draft.rollStatus = 'idle';
          draft.gameTally = e.returnValues.tally;
          draft.gameScore = e.returnValues.score;
        }
        break;

      case START_GAME:
        draft.gameStatus = 'starting';
        draft.gameTurn = 1;
        draft.gameTurnRoll = 1;
        draft.rollStatus = 'starting';
        draft.rollKey = action.key;
        draft.rollCount = 5;
        draft.rollBlock = undefined;
        draft.roll = [0,0,0,0,0];
        break;

      case CONTINUE_GAME:
        draft.gameStatus = 'continuing';
        draft.rollStatus = 'starting';
        draft.rollKey = action.key;
        draft.rollCount = action.rollCount;
        draft.roll = action.roll;
        draft.rollBlock = undefined;
        break;

      case ROLL_TRANSLATED:
        draft.gameStatus = 'player';
        draft.rollStatus = 'rolled';
        if (draft.rollCount === action.roll.length) {
          draft.roll = draft.roll.map((each) => (each !== 0) ? each : action.roll.pop())
        } else console.error ('ROLL_TRANSLATED rollCount mismatch ', action.roll);
        break;

      case ABORT_GAME:
        draft.gameStatus = 'aborted';
        draft.rollKey = undefined;
        draft.rollBlock = undefined;
        break;



      default: break;
    }
  });

export default appReducer;

