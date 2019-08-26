const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const plaid = require('plaid');
const express = require('express');
const uuid = require('uuid');
const twilio = require('twilio');
const bitly = require('bitly');

const BITLY_ACCESS_TOKEN = '[BITLY_ACCESS_TOKEN]';

const bitlyClient = new bitly.BitlyClient(BITLY_ACCESS_TOKEN, {});

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));

const PLAID_SECRET = '[PLAID_SECRET]';
const PLAID_CLIENT_ID = '[PLAID_CLIENT_ID]';
const PLAID_PUBLIC_KEY = '[PLAID_PUBLIC_KEY]';
const PLAID_ENV = 'sandbox';

const client = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  plaid.environments[PLAID_ENV],
  { version: '2018-05-22' }
);

const TWILIO_ACCOUNT_SID = '[TWILIO_ACCOUNT_SID]';
const TWILIO_AUTH_TOKEN = '[TWILIO_AUTH_TOKEN]';

const REACT_APP_NGROK_URL =
  process.env.REACT_APP_NGROK_URL || 'http://4d94f628.ngrok.io';

const twilioClient = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const db = (() => {
  let input
  try {
    input = require(`${__dirname}/db.json`)
  } catch (err) {
    input = {
      timeline: [],
      users: {},
    }
  }
  try {
    fs.mkdirSync(`${__dirname}/pdfs`);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  const handler = {
    get(target, property, receiver) {
      try {
        return new Proxy(target[property], handler);
      } catch (err) {
        return Reflect.get(target, property, receiver);
      }
    },
    defineProperty(target, property, descriptor) {
      const val = Reflect.defineProperty(target, property, descriptor);
      fs.writeFileSync(`${__dirname}/db.json`, JSON.stringify(db, undefined, 2));
      return val;
    },
  };
  return new Proxy(input, handler);
})();

const daysRequested = 60;
const generateOptions = (userId) => ({
  client_report_id: '123',
  webhook: `${REACT_APP_NGROK_URL}/webhook/${userId}`,
  user: {
    client_user_id: '789',
    first_name: 'Jane',
    middle_name: 'Leah',
    last_name: 'Doe',
    ssn: '123-45-6789',
    phone_number: '(555) 123-4567',
    email: 'jane.doe@example.com',
  },
});

const generatePdfName = (userId) => `${__dirname}/pdfs/${userId}.pdf`;

const generateAssetReport = (accessTokens, userId) => {
  console.log('generate asset report');
  client.createAssetReport(
    accessTokens, daysRequested, generateOptions(userId),
    (error, createResponse) => {
      if (error != null) {
        // Handle error.
        console.error(error);
        return;
      }

      const assetReportId = createResponse.asset_report_id;
      const assetReportToken = createResponse.asset_report_token;
      if (db.users[userId] == null) {
        console.error('could not find user', userId);
        return;
      }
      db.users[userId].assetReportId = assetReportId;
      db.users[userId].assetReportToken = assetReportToken;
    });
};

const getAuth = (accessTokens, userId) => {
  console.log('get auth');
  client.getAuth(accessTokens[0], {}, (err, results) => {
    if (err != null) {
      console.error(err);
      return;
    }

    db.users[userId].accounts = results.accounts;
    db.users[userId].numbers = results.numbers;
  });
};

const getInfo = (accessTokens, userId) => {
  console.log('get info')
  client.getIdentity(accessTokens[0], (err, result) => {
    if (err != null) {
      console.error(err);
      return;
    }
    db.users[userId].identity = result.identity;
  });
};

app.post('/invite', async (req, res) => {
  console.log(req.body);
  const { name, phone } = req.body;

  try {
    const id = uuid.v4();
    let { url } = await bitlyClient.shorten(`${REACT_APP_NGROK_URL}/link?user_id=${id}`);
    url = url.replace('http:', 'https:');
    const p = await twilioClient.messages.create({
      body: `Hi ${name}, WonderHome has requested an asset report. Click here to link your bank account: ${url}`,
      to: phone,
      from: '14158257515',
    });
    console.log(p);
    db.timeline.push(id);
    db.users[id] = {
      name,
      status: 'pending',
      phone,
      accessTokens: []
    };
  } catch (err) {
    console.log(err);
    res.status(500);
  }
  res.send();
});

app.get('/users', (req, res) => {
  const users = [];
  for (let i = db.timeline.length - 1; i >= 0; i -= 1) {
    const id = db.timeline[i];
    const user = db.users[id];
    users.push({
      id,
      name: user.name,
      status: user.status,
      phone: user.phone,
      accounts: user.accounts,
      numbers: user.numbers,
      identity: user.identity
    });
  }
  res.send(users).end();
});

app.get('/pdf/:userId', (req, res) => {
  const userId = req.params.userId;
  const pdfName = generatePdfName(userId);
  if (db.users[userId] == null) {
    res.status(500).send('no such user').end();
    return;
  }

  console.log('sending pdf');
  res.contentType('application/pdf');
  res.send(fs.readFileSync(pdfName));
});

app.post('/webhook/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log('received webhook for user id', userId);
  const assetReportToken = db.users[userId].assetReportToken;
  console.log('retrieving pdf for token', assetReportToken);
  client.getAssetReportPdf(assetReportToken, (error, pdfResponse) => {
    if (error != null) {
      // Handle error.
      console.error(error);
      return;
    }

    db.users[userId].status = 'ready';
    fs.writeFileSync(generatePdfName(userId), pdfResponse.buffer);
  });
});

// Exchange token flow - exchange a Link public_token for
// an API access_token
// https://plaid.com/docs/#exchange-token-flow
app.post('/get_access_token', function(request, response, next) {
  PUBLIC_TOKEN = request.body.public_token;
  client.exchangePublicToken(PUBLIC_TOKEN, function(error, tokenResponse) {
    if (error != null) {
      console.error(error);
      return response.json({
        error: error,
      });
    }
    ACCESS_TOKEN = tokenResponse.access_token;
    ITEM_ID = tokenResponse.item_id;
    console.error(tokenResponse);
    response.json({
      access_token: ACCESS_TOKEN,
      item_id: ITEM_ID,
      error: null,
    });
  });
});

app.post('/set_access_token', function(request, response, next) {
  const accessToken = request.body.access_token;
  const userId = request.body.user_id;
  console.log('got user id', userId);
  if (db.users[userId] == null) {
    response.status(500).end();
    return;
  }

  if (!db.users[userId].accessTokens.includes(accessToken)) {
    db.users[userId].accessTokens.push(accessToken);
  }
  client.getItem(accessToken, function(error, itemResponse) {
    if (error) {
      console.error(error);
      return;
    }

    db.users[userId].item_id = itemResponse.item.item_id;
    generateAssetReport(db.users[userId].accessTokens, userId);
    getAuth(db.users[userId].accessTokens, userId);
    getInfo(db.users[userId].accessTokens, userId);

    response.json({
      item_id: itemResponse.item.item_id,
      error: false,
    });
  });
});

app.use(express.static(path.resolve(__dirname, '..', 'build')));

app.get('*', function(req, res) {
  res.sendfile(path.resolve(__dirname, '..', 'build', 'index.html'));
});

app.listen(process.env.PORT || 8080, function() {
  return console.log('Started server on port', process.env.PORT || 8080);
});
