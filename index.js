const express = require('express');
const bodyParser = require('body-parser')
const axios = require('axios')
var Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env['AIRTABLE_API_KEY']
const AIRTABLE_BASE = process.env['AIRTABLE_BASE']

let base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE);

const app = express();
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send('Hello Express app!')
});

app.post('/new-order', async (req, res) => {
  const { restaurant, orderProducts, deliveryDate } = req.body
  console.log(restaurant[0])
   
  


  // const articleUrl = `https://api.airtable.com/v0/appj612hnjK0mcCgp/Artikel?&pageSize=50&view=Standard+Ansicht`
  // const customerUrl = 'https://api.airtable.com/v0/appj612hnjK0mcCgp/Kunden?pageSize=100&view=Standard+Ansicht'
  // const article = await fetchAirtable(articleUrl)
  // const customer = await fetchAirtable(customerUrl)
  // const aritcleDict = arrayToDict(article, 'Artikelnummer')
  // const customerDict = arrayToDict(customer, 'Kundennummer')

  res.sendStatus(200)
});

app.listen(3000, () => {
  console.log('server started');
});


async function fetchAirtable(baseUrl, offset = '') {
  let url = `${baseUrl}`
  if (offset != '') {
    url = `${baseUrl}&offset=${offset}`
  }
  const headers = { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }

  try {
    const response = await axios.get(url, { headers: headers })
    const data = response.data
    const records = data.records

    if (data.offset) {
      return records.concat(await fetchAirtable(baseUrl, data.offset))
    } else {
      return records
    }
  } catch (error) {
    console.error(error);
  }
}

function arrayToDict(array, key) {
  const newDict = {}
  array.map((record) => {
    newDict[record.fields[key]] = { ...record }
  })
  return newDict
}