import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Row, Icon, Button, Input, AutoComplete } from 'antd';
import { uiItemSelected, uiToggleCreateModal } from '../actions';

const { Option } = AutoComplete;



class BlockDice extends PureComponent {
  state = {
    searchResults: []
  };

  onSearchInput = async (searchInput) => {
    const { cachebase, network } = this.props;

    let searchResults = [];
    let search = (!!searchInput) ? searchInput.toString().trim() : '';
    console.log('SearchItem searchInput: '+ searchInput);
    if (!!search && search.length > 1){
      try {
        const snapshot = await 
          cachebase.ref(`/itemCache/${network}`)
          .orderByChild('name')
          .startAt(search)
          .endAt(`${search}\uf8ff`)
          .limitToFirst(12)
          .once("value");
        if (!!snapshot && !!snapshot.val()) {
          searchResults = Object.values(snapshot.val());
          console.log('SearchItem searchResults: ', searchResults);
        }else console.log('SearchItem searchResults is null');
      } catch (e) {
        console.error('SearchItem searchResults failed, e: ', e);
      }
    } 
    this.setState({ searchResults });
  };

  renderOption = (item) => (
    <Option key={item.id} value={item.id} text={item.name}>
      <span>{item.name}</span>
    </Option>
  );

  render() {
    const { searchResults } = this.state;
    const { dispatch, onItemSelected } = this.props;

    console.log('state ',this.state);
    return (
      <Row gutter="1" style={{ padding: "0px 8px", width: "100%" }}>
        <span style={{color: "#999"}}>Search Items:&nbsp;&nbsp;</span>
      </Row>
    );
  }
}

BlockDice.propTypes = {
  cachebase: PropTypes.object,
  network: PropTypes.string,
  uiSelectedItem: PropTypes.string,
  onItemSelected: PropTypes.func
}

export default connect((state) => ({
  cachebase: state.cachebase,
  network: state.network,
  uiSelectedItem: state.uiSelectedItem
}))(BlockDice); 



