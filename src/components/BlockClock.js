import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

class BlockClock extends PureComponent {

  render() {
    const { networkName, blockNumber, networkSyncing  } = this.props;
    return (
      <span style={{ whiteSpace: 'nowrap', paddingLeft: "2px", fontSize: "12px", paddingTop: "2px"}}>
        <span style={{color:"#ccc"}}>
          on&nbsp;
        </span>
        <span style={{color:"#ffc107"}}>
          {(!!networkName && !!blockNumber) && networkName}
        </span>
        &nbsp;
        <span style={((networkSyncing) ? {color:"#c77"} : {color:"#ccc"})}>
          {(!!blockNumber) && '#'+blockNumber}
        </span>
      </span>
    );
  }
}

BlockClock.propTypes = {
  networkSyncing: PropTypes.bool,
  networkName: PropTypes.string,
  //version: PropTypes.string,
  blockNumber: PropTypes.number
}

export default BlockClock;