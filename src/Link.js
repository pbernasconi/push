import React, { Component } from 'react';
import queryString from 'query-string';

import 'plaid-threads/lib/all.scss';

class Link extends Component {
  constructor() {
    super()
    this.state = {
      status: 'linking'
    };
  }

  componentDidMount() {
    const parsed = queryString.parse(this.props.location.search);
    const self = this;
    this.handler = window.Plaid.create({
      apiVersion: 'v2',
      clientName: 'Plaid Push',
      env: 'sandbox',
      product: ['auth', 'info', 'assets'],
      key: '05dca9a6cd9ae3201dd0dd1fd563ad',
      onSuccess: function(public_token) {
        window.$.post(`${process.env.REACT_APP_NGROK_URL}/get_access_token`, {
          public_token: public_token
        }, function(data) {
          self.setState({ status: 'linked' });
          var accessToken = data.access_token;
          if (accessToken != null && accessToken !== '') {
            window.$.post(`${process.env.REACT_APP_NGROK_URL}/set_access_token`, {
              access_token: accessToken,
              user_id: parsed.user_id,
            }, function(data) {
              console.log('item_id', data.item_id);
            });
          }
        });
      },
    });
    this.handler.open();
  }

  render() {
    if (this.state.status === 'linking') {
      return '';
    } else {
      return (
        <div className="page">
          <div className="container">
            <section className="section">
              <h1 className="primary-heading">Your account has successfully been linked</h1>
              <button className="button" onClick={() => this.handler.open()}>
                Link another account
              </button>
            </section>
          </div>
        </div>
      );
    }
  }
}

export default Link;
