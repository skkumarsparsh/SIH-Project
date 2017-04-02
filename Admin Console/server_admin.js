//importing all essential components and libraries required
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http')
const session = require('express-session')
const MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    passwordu = '',
    passworda = '12345';

//using this to decode the POST request of certain webpages
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')

//variable used for database
var db

//using this to implement sessions
app.use(session({
    secret: 'someRandomSecretValue',
    cookie: { maxAge: 1000 * 60 * 5 }
}));

//setting the header of the webpage to use javascript
const server = http.createServer((req,res) => {
  res.writeHead(200, {'Content-Type': 'application/javascript'});
  res.end('ok');
})

//sending http headers
function customHeaders( req, res, next ){
  res.setHeader( 'X-Powered-By', 'Made by Zenith Coders for SIH' );
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0"); // HTTP 1.1.
  res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
  res.setHeader("Expires", "-1"); // Proxies.
  next();
}

app.use(customHeaders)

//encrypt function
function encrypt(text,p){
  var cipher = crypto.createCipher(algorithm,p)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
//decrypt function
function decrypt(text,p){
  var decipher = crypto.createDecipher(algorithm,p)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

//initializing the mongodb DBMS server
MongoClient.connect('mongodb://skkumarsparsh:Extreme007@ds149030.mlab.com:49030/database2', (err, database) => {
  if (err) return console.log(err)
  db = database
  app.listen(8081, () => {
    console.log('listening on 8081')
  })
})

//logout request handled here
app.get('/logout', (req, res) => {
  delete req.session.auth;
  passworda="12345"
  passwordu=""
  res.send('<html></br></br></br><center><body><h4>Logged out!</h4><br/><br/><a href="/">Back to home</a></body></center></html>');
})

//first page to get initialized when the website address is entered
app.get('/', (req, res) => {
  if(req.session && req.session.auth && req.session.auth.userId) {
    res.redirect('/main')
  }
  res.sendFile(__dirname + '/pass.html')
})

//authentication page being displayed
app.get('/admin-disp', function(req, res) {
    if(req.session && req.session.auth && req.session.auth.userId) {
    db.collection('admin').find().toArray((err, result) => {
    if (err) return console.log(err)
    for(var i=0;i<result.length;i++)
    {
      result[i].tendername=decrypt(result[i].tendername,passworda)
      result[i].userid=decrypt(result[i].userid,passworda)
      result[i].username=decrypt(result[i].username,passworda)
      result[i].verification=decrypt(result[i].verification,passworda)
      result[i].auth=decrypt(result[i].auth,passworda)
    }
    //rendering auth.ejs
    res.render('auth.ejs', {admin: result})
  })
}
else
res.redirect('/')
})

//getting post request from admin form and encrypting the data received
app.post('/admin', function(req, res) {
    req.body.tendername = encrypt(req.body.tendername,passworda)
    req.body.userid = encrypt(req.body.userid,passworda)
    req.body.username = encrypt(req.body.username,passworda)
    req.body.verification = encrypt(req.body.verification,passworda)
    req.body.auth = encrypt(req.body.auth,passworda)
    db.collection('admin').save(req.body, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/admin-disp')
})
})

//verification key page
app.post('/pass', function(req, res) {
    if(passworda!=req.body.key)
    {
        return res.send('<html></br></br></br><center><body><h4>Wrong Admin Key</h4><br/><br/><a href="/">Back to login</a></body></center></html>');
    }
    passworda = req.body.key;
    req.session.auth = {userId: passworda};
    res.redirect('/main')
})

//decrypting the data from the userpass database and displaying it
app.get('/main', (req, res) => {
  if(req.session && req.session.auth && req.session.auth.userId) {
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

//getting the data from the quotes form and encrypting it
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