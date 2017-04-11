var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();
require("./parseTitle.js");
require("./crawler.js");

app.set('views', './views');
app.set('view engine', 'pug');

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
  }));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var sess; //session

var questions = [];
var tempQuestions = [];
var SERVER_STATE;


var contains = function(needle) {
    // Per spec, the way to identify NaN is that it is not equal to itself
    var findNaN = needle !== needle;
    var indexOf;

    if(!findNaN && typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                var item = this[i];

                if((findNaN && item !== item) || item === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle) > -1;
};

function generateID(){
  var hex_id;
  var numberId = Math.floor((Math.random() * 10000) + 1);
  console.log("generating ID");
  hex_id = numberId.toString(16);
  console.log("the id that was generated is: "+ hex_id);
  return hex_id;
}

crawlWorldNews(function(){
  //TODO I don't think the callback function actually calls when finished.
  console.log("cycleDone callback called!");
  questions = tempQuestions;
});

//PLAYER JSON FRAMEWOKR
/*
sess{
  visited:
  id:
}

Active_IDs {
  <id> {
    questions_seen:
    inProg:
  }
  <id> {
    ...
  }
  <id> ...
}

}

*/
var Active_IDs = {}

var qNum = 0;  //temporary tracker variable

app.use(express.static('public'));

app.get("/test-cookie", function(req, res){
  console.log("New User!");
  sess = req.session;
  if(sess.visited){
    //TODO get ID and determine which questions they have seen
    // and which one they were on

    console.log("sess was visited");
  }else{
    sess.visited = true;
    sess.id = generateID();
    console.log("sess was not visited");
    Active_IDs[sess.id] = {
      questions_seen: [],
      inProg: false
    }
  }
  res.redirect('index.html');

});


app.get("/qs/:qid", function(req, res){
  res.send(tempQuestions[req.params.qid]);
});

app.get("/get-question", function(req, res){
  sess = req.session;

  console.log(Active_IDs[sess.id].questions_seen);
  for(var i=0; i<tempQuestions.length; i++){
    if(Active_IDs[sess.id].questions_seen.indexOf(i) <= -1 ){

      sess.current_q = i;
      break;
    }
  }
  //TODO rework
});

app.post("/get-question", function(req, res){
  sess = req.session;

  res.status(202).end();
});

app.get("/getPlayerData", function(req, res){
  sess = req.session;
  console.log(Active_IDs[sess.id]);
  res.send(Active_IDs[sess.id]);
});

app.get("/startQuiz", function(req,res){
  sess = req.session;
  console.log(Active_IDs[sess.id]);
  if(Active_IDs[sess.id].inProg){

  }else{
    Active_IDs[sess.id].inProg = true;
  }
  res.send(Active_IDs[sess.id]);
});

app.get("/qs", function(req, res){
  res.send(tempQuestions);
});

app.get("/status", function(req, res){
  res.send({"state": SERVER_STATE});
});


var server = app.listen(8081, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
});
