const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http')
const session = require('express-session')
const MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = '';

app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')

var db

app.use(session({
    secret: 'someRandomSecretValue',
    cookie: { maxAge: 1000 * 60 * 5 }
}));


const server = http.createServer((req,res) => {
  res.writeHead(200, {'Content-Type': 'application/javascript'});
  res.end('ok');
})

function customHeaders( req, res, next ){
  // Switch off the default 'X-Powered-By: Express' header
  // OR set your own header here
  res.setHeader( 'X-Powered-By', 'Made by Zenith Coders for SIH' );
  // .. other headers here
  //res.setHeader('X-Foo', 'bar');
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0"); // HTTP 1.1.
  res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
  res.setHeader("Expires", "-1"); // Proxies.
  next();
}

app.use(customHeaders)

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

MongoClient.connect('mongodb://skkumarsparsh:Extreme007@ds149030.mlab.com:49030/database2', (err, database) => {
  if (err) return console.log(err)
  db = database
  app.listen(8080, () => {
    console.log('listening on 8080')
  })
})

app.get('/logout', (req, res) => {
  delete req.session.auth;
  password=""
  res.send('<html></br></br></br><center><body><h4>Logged out!</h4><br/><br/><a href="/">Back to home</a></body></center></html>');
})

app.get('/', (req, res) => {
  if(req.session && req.session.auth && req.session.auth.userId) {
    res.redirect('/main')
  }
  res.sendFile(__dirname + '/pass.html')
})

app.post('/pass', function(req, res) {
    password = req.body.key;
    req.session.auth = {userId: password};
    res.redirect('/main')
})

app.get('/main', (req, res) => {
  if(password!="") {
  db.collection('quotes').find().toArray((err, result) => {
    if (err) return console.log(err)
    // renders index.ejs
    for(var i=0;i<result.length;i++)
    {
      result[i].companyname=decrypt(result[i].companyname);
      result[i].orderplaced=decrypt(result[i].orderplaced);
      result[i].tender=decrypt(result[i].tender)
      result[i].orderdetails=decrypt(result[i].orderdetails)
      result[i].contactinfo=decrypt(result[i].contactinfo)
    }
    res.render('index.ejs', {quotes: result})
  })
}
else
res.redirect('/')
})

app.post('/quotes', (req, res) => {
  req.body.companyname = encrypt(req.body.companyname)
  req.body.orderplaced = encrypt(req.body.orderplaced)
  req.body.tender=encrypt(req.body.tender)
  req.body.orderdetails=encrypt(req.body.orderdetails)
  req.body.contactinfo=encrypt(req.body.contactinfo)
  db.collection('quotes').save(req.body, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')
    res.redirect('/main')
  })
})