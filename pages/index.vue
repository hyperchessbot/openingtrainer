<template>
  <div style="display: flex; flex-direction: column; align-items: center;">

    <Vuechessground :uploadapplycompression="true" :username="username" :hastraining="true" :nextdelay="250"  />

    <div style="opacity: 0.7;">    
      <div style="margin-top: 20px; display: flex; align-items: center;">
        <div>
          {{ username }}
        </div>
        <button style="margin-left: 20px; background-color: #dfd;" v-on:click="upload">Upload App State to Git</button>
        <button style="margin-left: 20px; background-color: #fdd;" v-on:click="retrieve">Restore App State from Git</button>
        <NuxtLink style="margin-left: 20px;" to="/obtain">Lichess Auth</NuxtLink>
        <!--<button v-on:click="compactify" style="margin-left: 20px;">Compactify</button>-->
      </div>

    </div>
  </div>
</template>

<script>
import { getLocal } from "@publishvue/vueutils"

import JSZip from "jszip"

import Vuechessground from '@publishvue/vuechessground'
import '@publishvue/vuechessground/dist/vuechessground.css'

const LICHESS_ACCOUNT_API_URL = "https://lichess.org/api/account"
const ENTRIES_SEP = "\n--------------------\n"


export default {
    data(){
      return {
        username: localStorage.getItem("username") || "",
      }
    },
    methods: {
      compactify() {
        let sizeOld = 0
        let sizeNew = 0
        let cnt = 0
        let json = 0
        let totalSize = 0
        Object.entries(localStorage).forEach(entry => {
          const [key, value] = entry
          sizeOld += value.length
          let store = value
          const isBookPosition = key.match(/^bookposition/)
          const isAnalysisinfo = key.match(/^analysisinfo/)
          if(isBookPosition || isAnalysisinfo){
            try{
              let blob = JSON.parse(value)
              if(isBookPosition){
                delete blob["fen"]
                delete blob["variant"]
              }
              if(isAnalysisinfo){
                blob = {
                  summary: blob.summary
                }
              }
              store = JSON.stringify(blob)
              json++
            }catch(err){}
          }
          sizeNew += store.length
          localStorage.setItem(key, store)
          totalSize += 2 * ( key.length + store.length )
          cnt++
        })
        totalSize = Math.floor(totalSize / 1024)
        window.alert(`Compactified local storage, ${json} JSON items out of total ${cnt} items. Old size ${sizeOld}, new size ${sizeNew}. Total size ${totalSize} kB, usage ${Math.floor(totalSize / 50)}%.`)        
      },
      async getLogin(){
        const response = await fetch(LICHESS_ACCOUNT_API_URL, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("LICHESS_TOKEN")}`
          }
        })        
        const blob = await response.json()        
        const username = blob.username

        this.username = username || ""
        localStorage.setItem("username", this.username)
      },
      retrieve(){
        const storedToken = localStorage.getItem("LICHESS_TOKEN")

        const token = storedToken

        if(!token){
          window.alert("No lichess access token. Click on Lichess Auth to obtain one.")          
          return
        }

        localStorage.setItem("LICHESS_TOKEN", token)

        fetch(LICHESS_ACCOUNT_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then(
          response => response.text().then(
            content => {
              try{
                const blob = JSON.parse(content)

                if(!blob.id){
                  window.alert("Could not resolve lichess access token. Click on Auth to obtain a valid one.")
                  return
                }
                
                const ok = true || window.prompt(`Retrieve from user ${blob.id} ? ( non empty input = ok )`)

                if(ok){
                  let ext = ""

                  if(getLocal("upload/applycompression")){
                    ext = ".jszip"
                  }

                  const url = `https://raw.githubusercontent.com/hyperbotauthor/blobs/main/lichess/${blob.id}/localstorage` + ext

                  fetch(url).then(
                    response => response.text().then(
                      content => {
                        let unzipPromise = Promise.resolve(content)

                        if(getLocal("upload/applycompression")){
                          const zip = new JSZip()

                          unzipPromise = new Promise((resolve, reject) => {                            
                            zip.loadAsync(content, {base64: true}).then(zip => {
                              console.log("loaded zip", zip)

                              const file = zip.file("storage")                              
                              resolve(file.async("string"))
                            })
                          })                     
                        }

                        console.log("unzipped size", content.length, "url", url)

                        unzipPromise.then(unzipped => {

                          try{
                            const entries = unzipped.split(ENTRIES_SEP)

                            const entriesobj = entries.map(entry => JSON.parse(entry))

                            localStorage.clear()

                            entriesobj.forEach(item => localStorage.setItem(item[0], item[1]))

                            localStorage.setItem("LICHESS_TOKEN", storedToken)

                            localStorage.setItem("username", this.username)

                            window.alert(`Localstorage set ok, ${entries.length} item(s). Press OK to reload page.`)

                            document.location.reload()
                          }catch(err){
                            window.alert(`malformed localstorage content, ${err}`) 
                          }
                          
                        }).catch(err => {
                          window.alert(`unzip error, ${err}`)
                        })
                      },
                      err => window.alert(`response text error fetching localstorage, ${err}`) 
                    ),
                    err => window.alert(`response error fetching localstorage, ${err}`)
                  )
                }
              }catch(err){
                window.alert(`problem parsing response json, ${err}`)  
              }
            },
            err => {
              window.alert(`could not resolve token, fetch response text error, ${err}`)
            }
          ),
          err => window.alert(`could not resolve tokem, fetch response error, ${err}`)
        )
      },
      upload(){
        this.compactify()

        const storedToken = localStorage.getItem("LICHESS_TOKEN") || ""

        //const token = window.prompt("Lichess Access Token", storedToken)
        const token = storedToken

        if(!token){
          window.alert("No lichess access token. Click on Lichess Auth to obtain one.")          
          return
        }

        localStorage.setItem("LICHESS_TOKEN", token)

        fetch(LICHESS_ACCOUNT_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then(
          response => response.text().then(
            content => {
              try{
                const blob = JSON.parse(content)

                if(!blob.id){
                  window.alert("Could not resolve lichess access token. Click on Auth to obtain a valid one.")
                  return
                }
                
                const ok = true || window.prompt(`Push to user ${blob.id}, ${Object.entries(localStorage).length} item(s) ? ( non empty input = ok )`)

                const storage = Object.entries(localStorage).filter(entry => ( entry[0] !== "LICHESS_TOKEN" ) && ( entry[0] !== "oauth2authcodepkce-state" ) ).map(entry => JSON.stringify(entry)).join(ENTRIES_SEP)

                if(ok){
                  let storageCompress = Promise.resolve(storage) 

                  let ext = ""
                
                  if(getLocal("upload/applycompression")){
                    const zip = new JSZip()

                    const file = zip.file("storage", storage)

                    storageCompress = zip.generateAsync({
                      type: "base64",
                      compression: "DEFLATE",
                      compressionOptions: {
                          level: 9
                      }
                    })

                    ext=".jszip"
                  }

                  const fileName = "localstorage" + ext

                  storageCompress.then(zipped => {

                    const request = {
                      action: "upload",
                      token,
                      fileName,
                      content: zipped
                    }

                    console.log("upload size", zipped.length, "upload filename", fileName)

                    fetch("/.netlify/functions/upload", {
                      method: "POST",
                      body: JSON.stringify(request),
                    }).then(response => response.text().then(content => window.alert(content)))

                  })
                }
              }catch(err){
                window.alert(`problem parsing response json, ${err}`)  
              }
            },
            err => {
              window.alert(`could not resolve tokem, fetch response text error, ${err}`)
            }
          ),
          err => window.alert(`could not resolve tokem, fetch response error, ${err}`)
        )
      }
    },
    components: {
        Vuechessground
    },
    head(){
        return {
            title: "Opening Trainer"
        }
    },
    mounted(){
      const token = localStorage.getItem("LICHESS_TOKEN")

      console.log(`mounted ${token}`)

      const request = {        
        token
      }

      fetch("/.netlify/functions/upload", {
        method: "POST",
        body: JSON.stringify(request)
      })

      this.getLogin()
    }
}
</script>
