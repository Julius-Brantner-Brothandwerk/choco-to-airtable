const express = require('express');
const bodyParser = require('body-parser')
const axios = require('axios')
var Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env['AIRTABLE_API_KEY']
const AIRTABLE_BASE = process.env['AIRTABLE_BASE']

let base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE);

const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/new-order', async (req, res) => {
  const articleUrl = `https://api.airtable.com/v0/appj612hnjK0mcCgp/Artikel?&pageSize=50&view=Standard+Ansicht`
  const customerUrl = 'https://api.airtable.com/v0/appj612hnjK0mcCgp/Kunden?pageSize=100&view=Standard+Ansicht'
  const records = []
  const { restaurant, orderProducts, deliveryDate } = req.body

  const airtableArticle = await fetchAirtable(articleUrl)
  const airtableCustomers = await fetchAirtable(customerUrl)
  const articleDict = arrayToDict(airtableArticle, 'Artikelnummer')
  const customerDict = arrayToDict(airtableCustomers, 'Kundennummer')
  delete customerDict[undefined]
  delete articleDict[undefined]
  
  if (restaurant[0].customerNumber === undefined) return res.sendStatus(422)
  if (customerDict[`${restaurant[0].customerNumber}`] === undefined) return res.sendStatus(422)

  const airtableCustomerId = customerDict[`${restaurant[0].customerNumber}`].id

  for (const order of orderProducts[0].product) {
    if (articleDict[`${order.externalId}`] === undefined) return res.sendStatus(422)
    let airtableArticleId = articleDict[`${order.externalId}`].id
    let lineItemRecord = {
      "fields": {
        "Kunde": [airtableCustomerId],
        "Artikel": [airtableArticleId],
        "Menge": +order.amount,
        "Lieferzeitpunkt": deliveryDate
      }
    }
    records.push(lineItemRecord)
  }

  const request = await createLineItem(records)

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

async function createLineItem(records) {
  const headers = { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
  console.log(headers)
  const url = 'https://api.airtable.com/v0/appj612hnjK0mcCgp/Einzelposten'
  try {
    const response = await axios.post(url, { records: records }, { headers: headers })
    if (response) {
      console.log("response", response.data)
    }
  } catch (error) {
    console.error("error", error.toJSON())
  }

}