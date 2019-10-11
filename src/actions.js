/*
 * App Actions
 *
 * Actions change things in your application
 * Since this boilerplate uses a uni-directional data flow, specifically redux,
 * we have these actions which are the only way your application interacts with
 * your application state. This guarantees that your state is up to date and nobody
 * messes it up weirdly somewhere.
 *
 * To add a new Action:
 * 1) Import your constant
 * 2) Add a function like this:
 *    export function yourAction(var) {
 *        return { type: YOUR_ACTION_CONSTANT, var: var }
 *    }
 */
import { LOGIN_ACCOUNT, LOGOUT_ACCOUNT, ACCOUNT_LOGIN, ACCOUNT_MOUNTED, ROLL_TRANSLATED,
         SEND_TX, TX_UPDATE, BLOCK_UPDATE, CONTRACT_EVENT, UI_CHANGE_DRAWER_VIEW,
         UI_TOGGLE_CREATE_MODAL, ACCOUNT_ERROR, START_GAME, ABORT_GAME, CONTINUE_GAME,
         UPDATE_BALANCE
       } from './ExtdevYatsyContracts';

/**
 * Load web3, this action starts the request saga
 * @return {object} An action object with a type of LOAD_WEB3
 */
export function loginAccount({mnemonic}) {
  return {
    type: LOGIN_ACCOUNT,
    mnemonic
  };
}
export function logoutAccount() {
  return {
    type: LOGOUT_ACCOUNT
  };
}
export function accountLogin({account, balance, contracts}) {
  return {
    type: ACCOUNT_LOGIN,
    account, balance, contracts
  };
}

export function accountError({error}) {
  return {
    type: ACCOUNT_ERROR,
    error
  };
}
export function accountMounted({events, eventLog, tableId, seat, lastBlock}) {
  return {
    type: ACCOUNT_MOUNTED,
    events, eventLog, tableId, seat, lastBlock
  };
}
export function blockUpdate({block, lastBlock}) {
  return {
    type: BLOCK_UPDATE,
    block, lastBlock
  };
}

export function contractEvent({event}) {
  return {
    type: CONTRACT_EVENT,
    event
  };
}

export function sendTx({contract, method, args}) {
  return {
    type: SEND_TX,
    contract, method, args
  };
}

export function txUpdate({tx}) {
  return {
    type: TX_UPDATE,
    tx
  };
}

export function uiChangeDrawerView({open, view}) {
  return {
    type: UI_CHANGE_DRAWER_VIEW,
    open, view
  };
}


export function uiToggleCreateModal({open, data}) {
  return {
    type: UI_TOGGLE_CREATE_MODAL,
    open, data
  };
}

export function startGame({key}) {
  return {
    type: START_GAME,
    key
  };
}

export function abortGame() {
  return {
    type: ABORT_GAME
  };
}

export function continueGame({key, rollCount, roll}) {
  return {
    type: CONTINUE_GAME,
    key, rollCount, roll
  };
}

export function rollTranslated({roll}) {
  return {
    type: ROLL_TRANSLATED,
    roll
  };
}

export function updateBalance({balance}) {
  return {
    type: UPDATE_BALANCE,
    balance
  };
}




