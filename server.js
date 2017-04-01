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
    cookie: { maxAge: 1000 * 60 * 30}
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

MongoClient.connect('mongodb://skkumarsparsh:Extreme007@ds137230.mlab.com:37230/sparsh-database', (err, database) => {
  if (err) return console.log(err)
  db = database
  app.listen(8080, () => {
    console.log('listening on 8080')
  })
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pass.html')
})

app.post('/pass', function(req, res) {
    password = req.body.key;
    res.redirect('/main')
})

app.get('/main', (req, res) => {
  if(password!="") {
  db.collection('quotes').find().toArray((err, result) => {
    if (err) return console.log(err)
    // renders index.ejs
    for(var i=0;i<result.length;i++)
    {
      result[i].name=decrypt(result[i].name);
      result[i].quote=decrypt(result[i].quote);
    }
    res.render('index.ejs', {quotes: result})
  })
}
else
res.redirect('/')
})

app.post('/quotes', (req, res) => {
  req.body.name = encrypt(req.body.name)
  req.body.quote = encrypt(req.body.quote)
  db.collection('quotes').save(req.body, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')
    res.redirect('/main')
  })
})

function dec2hex(s) { return (s < 15.5 ? '0' : '') + Math.round(s).toString(16); }
    function hex2dec(s) { return parseInt(s, 16); }

    function base32tohex(base32) {
        var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var bits = "";
        var hex = "";

        for (var i = 0; i < base32.length; i++) {
            var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
            bits += leftpad(val.toString(2), 5, '0');
        }

        for (var i = 0; i+4 <= bits.length; i+=4) {
            var chunk = bits.substr(i, 4);
            hex = hex + parseInt(chunk, 2).toString(16) ;
        }
        return hex;

    }

    function leftpad(str, len, pad) {
        if (len + 1 >= str.length) {
            str = Array(len + 1 - str.length).join(pad) + str;
        }
        return str;
    }

    function updateOtp() {
            
        var key = base32tohex($('#secret').val());
        var epoch = Math.round(new Date().getTime() / 1000.0);
        var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, '0');

        // updated for jsSHA v2.0.0 - http://caligatio.github.io/jsSHA/
        var shaObj = new jsSHA("SHA-1", "HEX");
        shaObj.setHMACKey(key, "HEX");
        shaObj.update(time);
        var hmac = shaObj.getHMAC("HEX");

        $('#qrImg').attr('src', 'https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=200x200&chld=M|0&cht=qr&chl=otpauth://totp/user@host.com%3Fsecret%3D' + $('#secret').val());
        $('#secretHex').text(key);
        $('#secretHexLength').text((key.length * 4) + ' bits'); 
        $('#epoch').text(time);
        $('#hmac').empty();

        if (hmac == 'KEY MUST BE IN BYTE INCREMENTS') {
            $('#hmac').append($('<span/>').addClass('label important').append(hmac));
        } else {
            var offset = hex2dec(hmac.substring(hmac.length - 1));
            var part1 = hmac.substr(0, offset * 2);
            var part2 = hmac.substr(offset * 2, 8);
            var part3 = hmac.substr(offset * 2 + 8, hmac.length - offset);
            if (part1.length > 0 ) $('#hmac').append($('<span/>').addClass('label label-default').append(part1));
            $('#hmac').append($('<span/>').addClass('label label-primary').append(part2));
            if (part3.length > 0) $('#hmac').append($('<span/>').addClass('label label-default').append(part3));
        }

        var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
        otp = (otp).substr(otp.length - 6, 6);

        $('#otp').text(otp);
    }
    function timer()
{
    var epoch = Math.round(new Date().getTime() / 1000.0);
    var countDown = 30 - (epoch % 30);
    if (epoch % 30 == 0) updateOtp();
    $('#updatingIn').text(countDown);
    
}

    $(function () {
        updateOtp();

        $('#update').click(function (event) {
            updateOtp();
            event.preventDefault();
        });

        $('#secret').keyup(function () {
            updateOtp();
        });
        
        setInterval(timer, 1000);
    });