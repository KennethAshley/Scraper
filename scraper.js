const axios = require('axios');
const accountsUrl = 'https://explore.veforge.com/api/accounts/top';
const fs = require('fs');
const _ = require('lodash');

const firebase = require('firebase-admin');
const serviceAccount = require('./vechain-3bff9-2e8468cf5ad3.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://vechain-3bff9.firebaseio.com'
});

const db = firebase.database();
var ref = db.ref("accounts");

let count = 50;
let offset = 0;
let accounts = [];
let totalToCalculate;

const nodeStatus = (account) => {
  if (account) {
    axios.get(`https://explore.veforge.com/api/accounts/${account.id}/nodeStatus`)
    .then(({ data }) => {
      accounts.push({
        ...data,
        ...account,
      });
    });
  }
};

const scrapper = () => {
  let accntCounter = 0;

  return new Promise((resolve, reject) => {
    axios.get(accountsUrl, {
      params: { count, offset }
    }).then(({ data: { accounts, total } }) => {
      // since the counter starts at 0 offset the accounts by one
      const size = accounts.length - 1; 
      totalToCalculate = total - count;

      const interval = setInterval(() => {
        nodeStatus(accounts[accntCounter]);
        accntCounter++;
        console.log('accounts ', accntCounter);

        // accntCounter is the counter of the 50 accounts
        if (accntCounter === size) {
          clearInterval(interval);
          resolve('done');
        }

      }, 2000);
    }).catch((err) => {
      if (err) {
        reject(err);
      }
    });
  });
};

const initScraper = async () => {
  if (!totalToCalculate || offset <= 8000) {
    const scrape = await scrapper();

    if (scrape === 'done') {
      offset += 50;
      console.log('offset: ', offset);
      initScraper();
    }
  } else {
    const hasNodes = _.groupBy(accounts, 'isNode');

    fs.writeFile('nodes.json', JSON.stringify(hasNodes.true), (err) => {
      console.log(err);
    });

    ref.set(hasNodes.true);
  }
};

initScraper();
