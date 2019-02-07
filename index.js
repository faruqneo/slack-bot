const express = require('express')
const request = require('request')

//Init app
const app = express()

request({
  method: 'GET',
  uri: 'https://sheets.googleapis.com/v4/spreadsheets/1H6WGjzEqzrB6b1eUgvrf-jERJrsxFWMFU7-sGaS6azY/values/sheet1?valueRenderOption=FORMATTED_VALUE&key=AIzaSyCoHRkco_23xSkUVqZbGc16eR2HfimJZAM',
 
},
function (error, response, body) {
  if (error) {
    return console.error(error);
  }
  console.log(body);
})

app.listen('3000', function(){
  console.log('server is running.')
})