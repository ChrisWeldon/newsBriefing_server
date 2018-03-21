var request = require('request');
var cheerio = require('cheerio');
var url = require('url-parse');
var parseTitle = require("./parseTitle.js");


module.exports = function(){
  var qs = []
  console.log("crawler called");
  return new Promise(function(resolve, reject){
    var pageToVisit = "https://www.reddit.com/r/worldnews/";
    var finishedW = false;
    console.log("Visiting page " + pageToVisit);
    request(pageToVisit, function(error, response, body) {
       if(error) {
         console.log("Error: " + error);
         reject(error);
       }else if(response.statusCode === 200) {
         // Parse the document body

         var $ = cheerio.load(body);
         console.log("Page title:  " + $('title').text());
         collectInternalLinks($);
         collectArticles($, function(){
           console.log("qs: " + qs);
           resolve(qs);
         });

         console.log(collectArticles($, function(){}))
       }else{
         reject("Status code: " + response.statusCode);
         console.log("Status code: " + response.statusCode);
       }
    });
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
  var cycleCount = 0;
  var titleLinks = $("a[class^='title may-blank outbound']");
  var finishedPushing = false;
  titleLinks.each(function() {
      var url = $(this).attr('href');
      var articleQInfo = parseTitle(rebuildSentWCache($(this).text(), cache_array, false), tagger, lexer);

      articleQInfo.then(function(result){ //RESOLVING PROMISE
        console.log("parseTitle promise resolved");
        //console.log(articleQInfo);
        if(false){
          return;
        }else{
          request(url, function(error, response, body){
            console.log("Request made");
            if(error) {
              console.log("Error: " + error);       // Check status code (200 is HTTP OK)
            }else if(response.statusCode === 200) { //console.log("Status code: " + response.statusCode);
              console.log("response.statusCode === 200");
              var tempTitle = {};
              var $ = cheerio.load(body);
              var all_p = $("p");
              all_p.each(function(){
                if($(this).text().length>150){
                  tempTitle["passage"] = $(this).text();
                }
              });
              //console.log("PASSAGE: " + tempTitle["passage"]);
              var source;
              if(url.indexOf("https")>-1 && url.indexOf(".com")){
                source = url.slice(url.indexOf("https://")+8, url.indexOf(".com")+4);
              }else if(url.indexOf("http")>-1 && url.indexOf(".com")){
                source = url.slice(url.indexOf("http://")+7, url.indexOf(".com")+4);
              }else{
                source = url;
              }
              console.log(source);
              tempTitle["source"] = source;
              tempTitle["link"] = url;
              tempTitle["title"] = result["input"];
              tempTitle["question"] = result["question"];
              tempTitle["answer"] = result["answer"];
              qs.push(tempTitle);

              if(cycleCount == surveySize){
                console.log("cycleCount = serveySize")
                finishedPushing = true;
                callback();
              }
              cycleCount++
            }
          });
        }
        return qs;

      }, function(err){console.log(err)});
  });

}
