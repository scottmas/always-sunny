var redis = require('redis');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
require('express-ws')(app);

var client = redis.createClient({host: 'redis'});

var port = process.argv[2] || 8080;
var MAX_RECENT = 10;

var recent = [];
var NodeCache = require('node-cache')
var urlCache = new NodeCache({stdTTL: 60*12, useClones: false});

var connections = [];

var BLACKLIST = {
  'get': ['/favicon.ico']
};

// HTTP requests to `/recent`
app.get('/recent.json', function(req, res){
  res.status(200).json(recent);
});

app.get('/recent', function(req, res){
  res.status(200).send(`
  <html>
    <head>
    <script>
      var host = window.document.location.host.replace(/:.*/, '');
      var ws = new WebSocket('ws://' + host + ':8080/');
      ws.onmessage = function (event) {
        document.body.innerHTML = event.data;
      };
    </script>
    </head>    
    <body>
      ${recentToHtml()}
    </body>
  </html>
  `)
});

//Blacklist
Object.keys(BLACKLIST).forEach(key => {
  BLACKLIST[key].forEach(url => {
    app[key](url, function(req, res){
      return res.status(200).end();
    })
  })
});

//Websocket requests
app.ws('/', function(ws){
  connections.push(ws);
  ws.on('close', function(){
    connections.splice(ws, 1);
  })
});

// All other HTTP requests
app.use(bodyParser.raw({limit: '100mb', type: () => true}));
app.use(function (req, res) {

  client.incr('blah', function(err){
    console.log('INCREMENTED');
  });

  if(req.header('always-sunny-get-last-hit')){
    return res.json(urlCache.get(req.originalUrl) || {});
  }

  var newRecent = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers
  };

  if(req.body instanceof Buffer){
    newRecent.rawBody = String(req.body).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  if((req.header('content-type') || '').toLowerCase().indexOf('application/json') !== -1){
    try{
      newRecent.jsonBody = JSON.parse(req.body);
    } catch(e){}
  }

  pushRecent(newRecent);
  urlCache.set(newRecent.url, newRecent);
  res.status(200).end();
});

// Initialize Server
app.listen(port, function(){
  console.log("Server listening for all http requests on port " + port)
});

//*** Utils ***/
function pushRecent(newRecent){
  recent.unshift(newRecent );
  if(newRecent.length > MAX_RECENT){
    recent.pop()
  }

  connections.forEach(ws => {
    ws.send(recentToHtml())
  })
}

function recentToHtml(){
  return "<html><body>" + recent.map(rowToHtml).join('<br/>\n' + "</body></html>")
}

function rowToHtml(row){
  return `
     <div>
        <h3>${row.method} ${row.url}</h3>
        ${row.jsonBody ? `<h5>JSON Body</h5><pre>${JSON.stringify(row.jsonBody, null, '  ')}</pre>`: ''}
        ${row.rawBody ? `<h5>Raw Body</h5><pre>${JSON.stringify(row.rawBody, null, '  ')}</pre>`: ''}
        <h5>Headers</h5> <pre>${JSON.stringify(row.headers, null, '  ')}</pre>            
     </div>
  `
}