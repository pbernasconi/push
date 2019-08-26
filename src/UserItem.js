import React, { Component } from 'react';

import 'plaid-threads/lib/all.scss'

class UserItem extends Component {
  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = { counter: 0 };
    this.base_url = 'foo.com/';
  }

  renderAssetsLink() {
    const url = `pdf/${this.props.userInfo.id}`;
    const ready = this.props.userInfo.status === 'ready';
    return (
      ready ?
        <a href={`${process.env.REACT_APP_NGROK_URL}/${url}`}>View Asset Report</a> :
        '...'
    );
  }

  renderInfoLink() {
    const ready = this.props.userInfo.status === 'ready';
    return (
      ready ?
        <a href="#" onClick={() => this.props.setMainUser(this.props.userInfo)}>View User Info</a> :
        '...'
    );
  }

  render() {
    return (
      <tr>
        <td>{this.props.userInfo.name}</td>
        <td>{this.props.userInfo.phone}</td>
        <td>{this.props.userInfo.status}</td>
        <td>{this.renderAssetsLink()}</td>
        <td>{this.renderInfoLink()}</td>
      </tr>
    );
  }
};

export default UserItem;

