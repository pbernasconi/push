import createBrowserHistory from 'history/createBrowserHistory'
import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import Link from './Link';

const history = createBrowserHistory();

ReactDOM.render((
  <BrowserRouter history={history}>
    <Switch>
      <Route exact path="/" component={App} />
      <Route path="/link" component={Link} />
    </Switch>
  </BrowserRouter>
), document.getElementById('root'));
