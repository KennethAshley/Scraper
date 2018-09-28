const axios = require('axios');
const _ = require('lodash');
const fs = require('fs');
const data = require('./accounts.json');

const format = () => {
  const hasNodes = _.groupBy(data, 'isNode');
  fs.writeFile('nodes.json', JSON.stringify(hasNodes.true), (err) => {
    console.log(err);
  });
};

format();


