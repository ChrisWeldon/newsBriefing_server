var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var express = require('express');

var app = express();


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

app.use(express.static('public'));

app.get("/qs/:qid", function(req, res){
  res.send(tempQuestions[req.params.qid]);
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
