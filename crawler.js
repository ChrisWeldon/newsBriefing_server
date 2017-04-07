var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var express = require('express');
var sessions = require('client-sessions');

var app = express();
app.set('views', './views');
app.set('view engine', 'pug');

var bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


var questions = [];
var tempQuestions = [];
var SERVER_STATE;
var surveySize = 24;

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

  }else{
    fills = string.match(/^([\w\-]+)/);
    fills["question"] = string.slice(0, fills["index"]) + "*a" + string.slice(fills["index"]+fills[0].length, fills["input"].length);
  }
  return fills;
}

// over



app.use(sessions({
  cookieName: 'mySession', // cookie name dictates the key name added to the request object
  secret: 'blargadeeblargblarg', // should be a large unguessable string
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
}));

app.use(function(req, res, next) {
  if (req.mySession.seenyou) {
    res.setHeader('X-Seen-You', 'true');
  } else {
    // setting a property will automatically cause a Set-Cookie response
    // to be sent
    req.mySession.seenyou = true;
    res.setHeader('X-Seen-You', 'false');
  }
});



var qNum = 0;  //temporary tracker variable
app.use(express.static('public'));

app.get("/qs/:qid", function(req, res){
  res.send(tempQuestions[req.params.qid]);
});

app.get("/get-question", function(req, res){
  res.render("sa", {"question": tempQuestions[qNum].question, "question_id":qNum})
  //TODO rework
});

app.post("/get-question", function(req, res){
  console.log(req.body.a);
  console.log(tempQuestions[qNum].answer);
  if(req.body.a == tempQuestions[qNum].answer){
    console.log("correct");
  }else{
    console.log("incorrect");
  }

  qNum++;
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
