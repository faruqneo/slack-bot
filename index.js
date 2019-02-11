const express = require('express')
const dotenv = require('dotenv').config();
const exphbs  = require('express-handlebars');
const sheet = require('./routes/sheet')


//Init app
const app = express()

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use('/',sheet)


app.listen('3000', function(){
  console.log('server is running.')
})