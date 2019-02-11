const express = require('express');
const {google} = require('googleapis');
const dotenv = require('dotenv').config();
const exphbs  = require('express-handlebars');
const mongoose = require('mongoose');
const Tokens = require('./model/token');
const SlackBots = require('slackbots')
const axios = require('axios');
const _ = require("underscore");
// const sheet = require('./routes/sheet')
// const slackbot = require('./routes/slackbot')


//Init app
const app = express()

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);


//Connect with mongodb
mongoose.connect('mongodb://localhost/neo', { useNewUrlParser: true });
let db = mongoose.connection;


/*Check connection*/
db.once('open',function(){
console.log("Connected to the Database");
});

/*Check for DB error */
db.on('error',function(err){
console.log(err);
});

//create bot
const bot = new SlackBots({
  token: process.env.slackbot_token,
  name: 'shazam'
});


//bot start
bot.on('start', () => {
  const params = {
      icon_emoji: ':notinterested:'
  };


  bot.postMessageToChannel('general', 'Hello world!', params);
})

//Error handling
bot.on('error', (err) => console.log(err))

//Handle messages
bot.on("message", function(data) {
  if (data.type !== "message") {
      return;
  }

  handleMessage(data.text);
});



  //Handeling Message
  function handleMessage(message) {
    switch(message) {
        case "Hello world!":break;
        case "hello":
            sendGreeting();
            break;
        default:
        spreadsheet(message)
          return;
    }
}


  function sendGreeting() {

    var greeting = getGreeting();
    bot.postMessageToChannel('general', greeting);
}
  
  function getGreeting() {
    var greetings = [
        "hello!",
        "hi there!",
        "cheerio!",
        "how do you do!",
        "¡hola!"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
}


  function spreadsheet(message){
      console.log(message);
      axios.get('http://localhost:3000/sheet')
      .then(function (response) {
        //console.log(response);
        let filtered = _.where(response.data, {name: message});
        let key=0;
        const params = {
          icon_emoji: ':notinterested:'
        };
        if(key in filtered)
        {
         // console.log(`Name : ${filtered[key].name}`)
         bot.postMessageToChannel('general', `Password is : ${filtered[key].password}`, params);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  }

/**
 * Google Sheet Sign-Up
 */
app.get('/', (req, res) => {
      const scopes = [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/spreadsheets'
      ];
      const url = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: scopes
      });
  res.redirect(url);
});

app.get('/callback', async(req,res) => {
  let code = req.query.code ;
  const {tokens} = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  //console.log(tokens)
  // res.send(tokens)
  res.redirect('/sheet')
});


oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
  console.log('token1')
  Tokens.updateOne({"admin":1},
      {
          $set:{
              "refresh_token" : tokens.refresh_token,
              "admin": 1
          }
      },
      {
          upsert : true
      })
      .then( (saved) => {
          console.log("Saved Tokens");
      })
      .catch( (err) => {
          console.log(err);
      });
  }
});


app.get('/sheet', async(req,res) => {
  try{
  let data = await Tokens.findOne({ 'admin':1 })
//      console.log(data);
      oauth2Client.setCredentials({
          refresh_token: data.refresh_token
      });
//       console.log(data);
  }catch(err){
      console.log(err);
      reject( err);
      return;
  }

  const sheets = google.sheets({
  version: 'v4',
  auth: oauth2Client
  });
  
  const params = {
  spreadsheetId: process.env.SPREAD_SHEET_ID,
      range: 'Sheet1',
      majorDimension: 'ROWS',  
  };
  
  sheets.spreadsheets.values.get(params)
  .then(sheet => {
    let data = [];

    for(let i=1; i < sheet.data.values.length; i++) 
    {
    data.push({"id": parseInt(sheet.data.values[i][0]), "name": sheet.data.values[i][1], "password": sheet.data.values[i][2]})
    }
    res.send(data)
      //console.log(sheet.data.values);
      //collecting data on data object

      // let data = [];

      // for(let i=1; i < sheet.data.values.length; i++) 
      // {
      // data.push({"id": parseInt(sheet.data.values[i][0]), "name": sheet.data.values[i][1], "password": sheet.data.values[i][2]})
      // }
      
      // //data filter is working using underscore module
      // let filtered = _.where(data, {password: "789"});
      // console.log(filtered)

      
  //  for(let key in filtered)
  //  {
  //    console.log(`Name : ${filtered[key].name}`)
  //  }
      
      //data filter is working using jquery
      // res.render('index',{
      // data: data
      // })
  })
  .catch(error => {
      console.error(error);
  }); 

})


app.listen('3000', function(){
  console.log('server is running.')
})