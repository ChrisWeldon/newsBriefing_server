var request = require('request');
var cheerio = require('cheerio');

surveySize = 24;

crawlWorldNews = function(callback){
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

collectInternalLinks = function($) {
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

collectArticles = function($, callback) {
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
