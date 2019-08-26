import React, { Component, createRef } from 'react';
import UserList from './UserList';

import 'plaid-threads/lib/all.scss'
import './App.css'

class App extends Component {
  constructor() {
    super();
    this.state = { main: null };
    this.name = createRef();
    this.phone = createRef();
    this.setMainUser = this.setMainUser.bind(this);
    this.submitForm = this.submitForm.bind(this);
  }

  submitForm() {
    const name = this.name.current.value;
    const phone = this.phone.current.value;
    this.name.current.value = '';
    this.phone.current.value = '';
    window.$.post('http://localhost:8080/invite', {
      name: name,
      phone: phone,
    }, function () {

    });
  }

  setMainUser(user) {
    this.setState({ main: user });
  }

  render() {
    const userInfo = (this.state.main == null) || (
      <section className="section">
        <h1 className="primary-heading">User Info</h1>
        <h2 className="secondary-heading">Accounts</h2>
        {
          this.state.main != null ? (
          <table>
          <thead>
            <th>Account Name</th>
            <th>Account Balance</th>
          </thead>
          <tbody>
          {this.state.main.accounts.map(account => (
            <tr>
              <td><p key={account.mask}>{account.name} {account.mask}</p></td>
              <td><p>${account.balances.current}.00</p></td>
            </tr>
          ))}
          </tbody>
          </table>
          ) : null
        }

        <h2 className="secondary-heading">Addresses</h2>
        {this.state.main == null || this.state.main.identity.addresses.map(address => (
          <p key={address.data.zip}>{address.data.street}, {address.data.city} {address.data.state} {address.data.zip}</p>
        ))}
        <h2 className="secondary-heading">Emails</h2>
        {this.state.main == null || this.state.main.identity.emails.map(email => (
          <p key={email.data}>{email.data}</p>
        ))}
        <h2 className="secondary-heading">Phone Numbers</h2>
        {this.state.main == null || this.state.main.identity.phone_numbers.map(phone => (
          <p key={phone.data}>{phone.data}</p>
        ))}
      </section>
    );
    const disabled = false;
    return (
      <div className="page">
        <nav className="horizontal-navigation">
          <ul className="horizontal-navigation__section horizontal-navigation__section--is-left-side">
            <li className="horizontal-navigation__item horizontal-navigation__item--is-brand">
              <a className="horizontal-navigation__anchor" href="/">
                <span className="brand brand--is-horizontal-lockup">
                  <span className="brand__logo"></span>
                  <span className="brand__logotype"></span>
                </span>
              </a>
            </li>
          </ul>
        </nav>
        <div className="container">
          <section className="section">
            <h1 className="primary-heading">Send new Link invite to user</h1>
            <div className="row">
              <input className="input-group__field row-item" placeholder="Name" type="text" ref={this.name} />
              <input className="input-group__field row-item" placeholder="Phone Number" type="text" ref={this.phone} />
              <button className="button button--is-primary row-item" onClick={this.submitForm} disabled={disabled}>Trigger SMS</button>
            </div>
          </section>
        </div>

        <div className="container">
          <section className="section">
            <h1 className="primary-heading">Users</h1>
            <UserList setMainUser={this.setMainUser} />
          </section>
          {userInfo}
        </div>
      </div>
    );
  }
}

export default App;
