const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http')
const session = require('express-session')
const MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    passwordu = '',
    passworda = '';

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

function encrypt(text,p){
  var cipher = crypto.createCipher(algorithm,p)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text,p){
  var decipher = crypto.createDecipher(algorithm,p)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

MongoClient.connect('mongodb://skkumarsparsh:Extreme007@ds149030.mlab.com:49030/database2', (err, database) => {
  if (err) return console.log(err)
  db = database
  app.listen(8081, () => {
    console.log('listening on 8081')
  })
})

app.get('/logout', (req, res) => {
  delete req.session.auth;
  passworda=""
  passwordu=""
  res.send('<html></br></br></br><center><body><h4>Logged out!</h4><br/><br/><a href="/">Back to home</a></body></center></html>');
})

app.get('/', (req, res) => {
  if(req.session && req.session.auth && req.session.auth.userId) {
    res.redirect('/main')
  }
  res.sendFile(__dirname + '/pass.html')
})

app.post('/pass', function(req, res) {
    passworda = req.body.key;
    req.session.auth = {userId: passworda};
    res.redirect('/main')
})

app.get('/main', (req, res) => {
  if(passworda!="") {
  db.collection('userpass').find().toArray((err, result) => {
    if (err) return console.log(err)
    // renders index.ejs
    for(var i=0;i<result.length;i++)
    {
      passwordu = decrypt(result[i].verikey,passworda)
      result[i].name=decrypt(result[i].name,passwordu)
      result[i].quote=decrypt(result[i].quote,passwordu)
      result[i].username=decrypt(result[i].username,passwordu)
      result[i].password=decrypt(result[i].password,passwordu)
      result[i].verikey=decrypt(result[i].verikey,passworda)

    }
    res.render('admin.ejs', {quotes: result})
  })
}
else
res.redirect('/')
})

app.post('/quotes', (req, res) => {
  passwordu = req.body.verikey
  req.body.name = encrypt(req.body.name,passwordu)
  req.body.quote = encrypt(req.body.quote,passwordu)
  req.body.username = encrypt(req.body.username,passwordu)
  req.body.password = encrypt(req.body.password,passwordu)
  req.body.verikey = encrypt(req.body.verikey,passworda)
  db.collection('userpass').save(req.body, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')
    res.redirect('/main')
  })
})