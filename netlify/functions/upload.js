const { Octokit } = require("octokit")
const fetch = require('node-fetch')

const LICHESS_ACCOUNT_API_URL = "https://lichess.org/api/account"

const octokit = new Octokit({ auth: process.env["GIT_TOKEN"] })

exports.handler = async function(event, context) {
  if(event.httpMethod === "POST"){
    const request = JSON.parse(event.body)

    const token = request.token || process.env["BOT_TOKEN"]

    const response = await fetch(LICHESS_ACCOUNT_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const accountBlob = await response.text()

    const account = JSON.parse(accountBlob)

    const id = account.id

    if(!id){
      return {
        statusCode: 404,
        body: "ERROR: Could not resolve token."
      }
    }

    const storePath = `lichess/${id}/${request.fileName || "log"}`

    console.log("resolved store path", storePath)

    const content = request.content || ""

    const buff = Buffer.from(content)

    const base64data = buff.toString('base64')

    const inforesp = await fetch(`https://api.github.com/repos/hyperbotauthor/blobs/contents/${storePath}`)

    const info = JSON.parse(await inforesp.text())

    console.log("blob size base64", base64data.length)

    const create = await octokit.rest.repos.createOrUpdateFileContents({
      owner: "hyperbotauthor",
      repo: "blobs",
      path: storePath,
      message: `Store path ${storePath}, size ${content.length}`,
      content: base64data,
      sha: info.sha || undefined
    })

    const createSummary = {
      storePath,
      status: create.status,
      contentSize: create.data.content.size
    }

    console.log(createSummary)

    return {
      statusCode: 200,
      body: JSON.stringify(createSummary)
    }
  } else {
    return {
      statusCode: 200,
      body: "you should use a POST request"
    }
  }  
  
}