import React, { Component } from 'react';

import UserItem from './UserItem';
import 'plaid-threads/lib/all.scss'

class UserList extends Component {
  constructor(props) {
    super(props);
    this.state = { counter: 0, users: [] };
    this.base_url = 'foo.com/';
    this.refresh = this.refresh.bind(this);
  }

  refresh() {
    fetch(`/users`)
      .then(result => result.json())
      .then(users =>
        this.setState({ users }, () => setTimeout(this.refresh, 1000))
      );
  }

  componentDidMount() {
    this.refresh();
  }

  render() {
    if (this.state.users.length === 0) {
      return <p>No user has linked their account yet.</p>
    }

    const userRows = this.state.users.map(userInfo => (
      <UserItem key={userInfo.id} userInfo={userInfo} setMainUser={this.props.setMainUser} />
    ));
    return (
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Assets</th>
            <th>Accounts</th>
          </tr>
        </thead>
        <tbody>
          { userRows }
        </tbody>
      </table>
    );
  }
};

export default UserList;
