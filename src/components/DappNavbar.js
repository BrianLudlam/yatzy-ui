import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Layout, Row, Col, Button, Badge } from 'antd';
import { uiChangeDrawerView} from '../actions';
import BlockClock from "./BlockClock";
const { Header } = Layout;

class DappNavbar extends PureComponent {

  render() {
    const { loadingWeb3, web3Error, networkSyncing, networkName, blockNumber, account, 
            accountError, newEventCount, newTxCount, dispatch } = this.props;
    
    return (
      <Header style={{paddingLeft: "12px", paddingRight: "12px", paddingTop: "0px"}}>
        <Row style={{height: "100%", width: "100%"}}>
          <Col xs={14} sm={14} md={12} lg={12} xl={12} >
              <span style={{fontSize: "24px", fonWeight: "bold", color: "white"}}>
                Block Yatzy
              </span>
              {!!account && ( 
                <BlockClock 
                  networkSyncing={networkSyncing} 
                  networkName={networkName}
                  blockNumber={(!blockNumber) ? 0 : blockNumber}/>)}
          </Col>
          <Col offset={2} xs={3} sm={3} md={3} lg={3} xl={3} style={{height: "100%"}}>
            <Button className="hover-yellow" size="large" ghost type="link" style={{padding: "11px 0px 0px 0px", marginTop: "11px", marginLeft: "-32px"}} 
              onClick={() => dispatch(uiChangeDrawerView({open: true, view: 'account'}))}> 
              Account
              {(!account) && (<Badge label={'create'} style={{marginBottom: "0px", backgroundColor: "green"}}/>)}
            </Button>
          </Col>
          <Col offset={0} xs={3} sm={3} md={3} lg={3} xl={3} style={{height: "100%"}}>
            <Button className="hover-yellow" size="large" ghost type="link" style={{padding: "11px 0px 0px 0px", marginTop: "11px", marginLeft: "-16px"}}
              onClick={() => dispatch(uiChangeDrawerView({open: true, view: 'events'}))}> 
              Events
               {(newEventCount > 0) && (<Badge count={newEventCount} overflowCount={99} 
                style={{marginBottom: "0px", backgroundColor: "green"}}/>)}
            </Button>
          </Col>
          <Col offset={0} xs={2} sm={2} md={2} lg={2} xl={2} style={{height: "100%"}}>
            <Button className="hover-yellow" size="large" ghost type="link" style={{padding: "11px 0px 0px 0px", marginTop: "11px", marginLeft: "-2px"}}
              onClick={() => dispatch(uiChangeDrawerView({open: true, view: 'txs'}))}> 
              Txs 
               {(newTxCount > 0) && (<Badge count={newTxCount} overflowCount={99} 
                style={{marginBottom: "0px", backgroundColor: "green"}}/>)}
            </Button>
          </Col>
        </Row>
      </Header>
    );
  }
}

DappNavbar.propTypes = {
  networkName: PropTypes.string,
  networkSyncing: PropTypes.bool,
  blockNumber: PropTypes.number,
  loadingAccount: PropTypes.bool,
  mountingAccount: PropTypes.bool,
  account: PropTypes.string,
  accountError: PropTypes.string,
  newEventCount: PropTypes.number,
  newTxCount: PropTypes.number
}

export default connect((state) => ({
  networkName: 'extdev-plasma1',
  networkSyncing: false,
  blockNumber: (!!state.block) ? state.block.number : undefined,
  loadingAccount: state.loadingAccount,
  account: state.account,
  accountError: state.accountError,
  newEventCount: state.newEventCount,
  newTxCount: state.newTxCount
}))(DappNavbar);

