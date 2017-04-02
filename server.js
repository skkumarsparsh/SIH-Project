const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http')
const session = require('express-session')
const MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    verify = '',
    passworda = '12345';

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

var username;
app.use(customHeaders)

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,verify)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,verify)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function decrypt2(text,p){
  var decipher = crypto.createDecipher(algorithm,p)
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
  verify=""
  res.send('<html></br></br></br><center><body><h4>Logged out!</h4><br/><br/><a href="/">Back to home</a></body></center></html>');
})

app.get('/', (req, res) => {
  if(req.session && req.session.auth && req.session.auth.userId) {
    res.redirect('/main')
  }
  res.sendFile(__dirname + '/login-page.html')
})

app.post('/login-page', function(req, res) {
    username = req.body.username;
    var password = req.body.password;
    var passwordu;
    db.collection('userpass').find().toArray((err, result) => {
      if (err) return console.log(err)
      for(var i=0;i<result.length;i++)
      {
        passwordu = decrypt2(result[i].verikey,passworda)
        if((username===decrypt2(result[i].username,passwordu))&&(password===decrypt2(result[i].password,passwordu)))
        {
            console.log('Username/Password correct')
            return res.sendFile(__dirname + '/pass.html')
        }
      }
      return res.send('<html><script>alert("Wrong Username/Password");</script><a href="/">Go back to login</a></html>')
    })
})

app.post('/pass', function(req, res) {
    verify = req.body.key;
    req.session.auth = {userId: verify};
    res.redirect('/main')
})

app.get('/main', (req, res) => {
  if(req.session && req.session.auth && req.session.auth.userId) {
  db.collection('quotes').find().toArray((err, result) => {
    if (err) return console.log(err)
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