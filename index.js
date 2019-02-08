const express = require('express')
const {google} = require('googleapis');
const dotenv = require('dotenv').config();
const request = require('request')
const mongoose = require('mongoose');
const Tokens = require('./model/token');

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

//Init app
const app = express()

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);


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
    var code = req.query.code ;
    const {tokens} = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
  //  console.log(tokens)
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
      range: process.env.ranges_to_find
    };
    
    sheets.spreadsheets.values.get(params)
      .then(res => {
        console.log(res);
        //res.send(res);
      })
      .catch(error => {
        console.error(error);
      });
  })

app.listen('3000', function(){
  console.log('server is running.')
})