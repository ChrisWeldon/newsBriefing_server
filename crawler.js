var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();

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
var surveySize = 24;

var Active_IDs = {}


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


function crawlWorldNews(callback){
  var pageToVisit = "https://www.reddit.com/r/worldnews/";
  console.log("Visiting page " + pageToVisit);
  request(pageToVisit, function(error, response, body) {
     if(error) {
       console.log("Error: " + error);
     }
     // Check status code (200 is HTTP OK)
     console.log("Status code: " + response.statusCode);
     if(response.statusCode === 200) {
       // Parse the document body

       var $ = cheerio.load(body);
       console.log("Page title:  " + $('title').text());
       collectInternalLinks($);
       collectArticles($, callback);
     }
  });
}

function searchForWord($, word) {
  var bodyText = $('html > body').text();
  if(bodyText.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
    return true;
  }
  return false;
}

function collectInternalLinks($) {
  var allRelativeLinks = [];
  var allAbsoluteLinks = [];

  var relativeLinks = $("a[href^='/']");
  relativeLinks.each(function() {
      allRelativeLinks.push($(this).attr('href'));

  });

  var absoluteLinks = $("a[href^='http']");
  absoluteLinks.each(function() {
      allAbsoluteLinks.push($(this).attr('href'));
  });

  console.log("Found " + allRelativeLinks.length + " relative links");
  console.log("Found " + allAbsoluteLinks.length + " absolute links");
}

function collectArticles($, callback) {
  SERVER_STATE = "UPDATING_ARTICLES";
  tempQuestions = [];
  cycleCount = 0;
  var titleLinks = $("a[class^='title may-blank outbound']");
  titleLinks.each(function() {
      var url = $(this).attr('href');

      request(url, function(error, response, body){
        if(error) {
          console.log("Error: " + error);
        }
        // Check status code (200 is HTTP OK)
        //console.log("Status code: " + response.statusCode);
        if(response.statusCode === 200) {
          // Parse the document body
          var tempTitle = {};
          var $ = cheerio.load(body);
          var articleQInfo = parseTitle($('title').text());
          //console.log("ARTICLE Page title:  " + $('title').text());
          tempTitle["link"] = url;
          tempTitle["title"] = articleQInfo["input"];
          tempTitle["question"] = articleQInfo["question"];
          tempTitle["answer"] = articleQInfo[0];
          if(articleQInfo != []){
            tempQuestions.push(tempTitle);
          }

          if(cycleCount == surveySize){
            callback();
          }
          cycleCount++
        }
      });
  });
}

// CAUTION, the next part is garbage code that will be replaced with parser.js

function parseTitle(title){
  var string = title;
  var fills = [];
  var returnArray = [];
  //editing the string to make good title
  if(title.indexOf("| ")> -1){
    //console.log(string + " : FOUND ' | ' ");
    string = string.slice(0 ,string.indexOf("| "));
  }if(title.indexOf(" — ")> -1){
    //console.log(string + " : FOUND ' — ' ");
    string = string.slice(0 ,string.indexOf(" — "));
  }if(title.indexOf(" - ")> -1){
    //console.log(string + " : FOUND ' - ' ");
    string = string.slice(0 ,string.indexOf(" - "));
  }if(title.indexOf(" -- ")> -1){
    //console.log(string + " : FOUND ' -- ' ");
    string = "";
  }
  string = string.trim();

  // ^([\w\-]+) = the first word in a line
  // ^((?:\S+\s+){2}\S+).* = is true if there are more than three words
  var firstWord = string.match(/^([\w\-]+)/);
  if( firstWord == "who" || firstWord == "what" || firstWord == "where" || firstWord == "when" || firstWord == "why" || string.match(/^((?:\S+\s+){2}\S+).*/)== false){
    string = "";
  }
  // (?!^)\b[A-Z]\S+  =  capital lettered word which is not the first word and a word containing more than one character
  if(/(?!^)\b[A-Z]\S+/.test(string)){
    fills = string.match(/(?!^)\b[A-Z]\S+/);
    fills["question"] = string.slice(0, fills["index"]) + "*a" + string.slice(fills["index"]+fills[0].length, fills["input"].length);

  }else if(/^([\w\-]+)/.test(string)){
    fills = string.match(/^([\w\-]+)/);
    fills["question"] = string.slice(0, fills["index"]) + "*a" + string.slice(fills["index"]+fills[0].length, fills["input"].length);
  }
  return fills;
}

// over



var qNum = 0;  //temporary tracker variable

app.use(express.static('public'));

app.get("/test-cookie", function(req, res){
  console.log("New User!");
  sess = req.session;
  if(sess.visited){
    //TODO get ID and determine which questions they have
    // and which one they were on

    console.log("sess was visited");
  }else{
    sess.visited = true;
    sess.id = generateID();
    console.log("sess was not visited");
    Active_IDs[sess.id] = {
      questions_seen: []
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
      res.render("sa", {"question": tempQuestions[i].question, "question_id":i});
      sess.current_q = i;
      break;
    }
  }
  //TODO rework
});

app.post("/get-question", function(req, res){
  sess = req.session;
  console.log(req.body.a);
  console.log(tempQuestions[qNum].answer);
  if(req.body.a == tempQuestions[qNum].answer){
    console.log("correct");
  }else{
    console.log("incorrect");
  }
  Active_IDs[sess.id].questions_seen.push(sess.current_q);
  qNum++;

  res.status(202).end();
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
