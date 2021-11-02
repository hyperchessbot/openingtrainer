const querystring = require("querystring")
const { MongoClient } = require('mongodb')
const MONGODB_URI = process.env.MONGODB_URI
const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
const fetch = require("node-fetch")
const fetchclient = require("@publishvue/fetchclient")

const FORM_FIELDS = [
  "LICHESS_TOKEN",
  "COLLECTION",
  "DOCUMENT_ID",
  "DOCUMENT",
  "ACTION",
  "MAX",
]

function doDbAction(request){
  const db = client.db("lichessdb")

  let collName = request.account.id

  if(request.COLLECTION) collName += "#" + request.COLLECTION

  const coll = db.collection(collName)

  let max = 100

  if(request.MAX){
    const parsedMax = parseInt(request.MAX)

    if(!isNaN(parsedMax)){
      if(parsedMax >= 1) max = parsedMax
    }
  }

  console.log("do db action", FORM_FIELDS.map(field => ([field, request[field]])), "collection", collName, "max", max)  

  return new Promise(resolve => {
    if(request.ACTION === "set"){
      coll.updateOne(
        {
          _id: request.DOCUMENT_ID
        },
        {
          $set: {
            content: request.DOCUMENT
          }
        },
        {
          upsert: true
        },
      ).then(result => {        
        resolve({
          statusCode: 200,
          body: JSON.stringify(result)
        })
      })
    }else if(request.ACTION === "listcollections"){
      db.listCollections().toArray().then(result => {       
        resolve({
          statusCode: 200,
          body: JSON.stringify(result.map(item => item.name.split("#")).filter(parts => parts[0] == request.account.id).map(parts => parts.join("#")))
        })
      })
    }else if(request.ACTION === "bulkwrite"){
      coll.bulkWrite(JSON.parse(request.DOCUMENT)).then(result => {        
        resolve({
          statusCode: 200,
          body: JSON.stringify(result)
        })
      })
    }else if(request.ACTION === "getall"){
      coll.find(
        {

        },
        {
          _id: true
        }
      ).limit(max).toArray().then(result => {        
        resolve({
          statusCode: 200,
          body: JSON.stringify(result)
        })
      })
    }else if(request.ACTION === "get"){
      coll.findOne(
        {
          _id: request.DOCUMENT_ID
        }
      ).then(result => {        
        resolve({
          statusCode: 200,
          body: JSON.stringify(result)
        })
      })
    }else{
      coll.deleteOne(
        {
          _id: request.DOCUMENT_ID
        }
      ).then(result => {        
        resolve({
          statusCode: 200,
          body: JSON.stringify(result)
        })
      })
    }
  })
}

function auth(request){
  const lichessClient = new fetchclient.FetchClient(fetch, {
    apiBaseUrl: 'https://lichess.org/api',
    bearer: request['LICHESS_TOKEN'],
  })

  return new Promise(resolve => {
    lichessClient.fetchJson('account').then(account => {
      if(account.error){
        resolve ({
          statusCode: 401,
          body: JSON.stringify({
            status: "lichessnotauthorized"
          })
        })
      }else{
        resolve ({
          statusCode: 200,
          account: account
        })
      }
    })
  })
}

function connect(request){  
  return new Promise(resolve => {
    client.connect(err => {
      if(err){
        console.error("MongoDb connection failed", err)
        resolve ({
          statusCode: 500,
          body: JSON.stringify({
            status: "mongodbconnecterror"
          })
        })
      }else{
        console.log("MongoDb connected!")		
        resolve({
          statusCode: 200,
          body: JSON.stringify({
            status: "ok",
            took: new Date().getTime() - request._receivedAt
          })
        })
      }
    })
  })
}

exports.handler = async (event, context) => {
  if(event.httpMethod === "POST"){
    const params = event.queryStringParameters
    
    let request
    if(params.payload === "form"){
      request = querystring.parse(event.body)
    }else{
      request = JSON.parse(event.body)
    }

    request._receivedAt = new Date().getTime()

    let authresponse = await auth(request)

    if(authresponse.statusCode !== 200){
      return authresponse
    }

    

    request.account = authresponse.account

    let response = await connect(request)

    if(response.statusCode !== 200) return response

    console.log("connect ok")

    const dbActionResponse = await doDbAction(request)

    return dbActionResponse
  } else {
    return {
      statusCode: 200,
      body: "you should use a POST request"
    }
  }    
}
