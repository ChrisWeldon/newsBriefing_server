var request = require('request');
var cheerio = require('cheerio');
var url = require('url-parse');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();
var levDistance = require("./LevDistance.js");
var parseTitle = require("./parseTitle.js");
var fs = require("file-system");
var rebuildSentWCache = require("./cacher.js");
var pos = require('pos');


var lexer = new pos.Lexer()
var tagger = new pos.Tagger();



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
var tempQuestions = [];
var questions = [];

var SERVER_STATE;
//addCache("Robert Mueller");

var surveySize = 24;


crawlWorldNews = function(callback){
  var pageToVisit = "https://www.reddit.com/r/worldnews/";
  var finishedW = false;
  console.log("Visiting page " + pageToVisit);
  request(pageToVisit, function(error, response, body) {
     if(error) {
       console.log("Error: " + error);
     }else if(response.statusCode === 200) {
       // Parse the document body

       var $ = cheerio.load(body);
       console.log("Page title:  " + $('title').text());
       collectInternalLinks($);
       collectArticles($, callback);
     }else{
       console.log("Status code: " + response.statusCode);
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

var cache_array = JSON.parse(fs.readFileSync("caches/name-bank.json", "utf8").slice(0, -1)+"}");




collectArticles = function($, callback) {
  SERVER_STATE = "UPDATING_ARTICLES";
  var cycleCount = 0;
  var titleLinks = $("a[class^='title may-blank outbound']");
  var finishedPushing = false;
  titleLinks.each(function() {
      var url = $(this).attr('href');
      var articleQInfo = parseTitle(rebuildSentWCache($(this).text(), cache_array, false), tagger, lexer);

      articleQInfo.then(function(result){ //RESOLVING PROMISE
        //console.log(articleQInfo);
        if(false){
          return;
        }else{
          request(url, function(error, response, body){
            if(error) {
              console.log("Error: " + error);       // Check status code (200 is HTTP OK)
            }else if(response.statusCode === 200) { //console.log("Status code: " + response.statusCode);
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
              if(articleQInfo != []){
                tempQuestions.push(tempTitle);
              }

              if(cycleCount == surveySize){
                finishedPushing = true;
                callback();
              }
              cycleCount++
            }
          });
        }

      }, function(err){console.log(err)});
  });
}

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
  hex_id = numberId.toString(16);
  console.log("the id that was generated is: "+ hex_id);
  return hex_id;
}

questions = crawlWorldNews(function(){
  console.log("cycleDone callback called!");
});

function isCorrect(word, sess){
  //TODO answer cruncher goes here
  console.log(tempQuestions[Active_IDs[sess.id].current_q].answer);
  if(levDistance(tempQuestions[Active_IDs[sess.id].current_q].answer , word)<=3){
    return true;
  }else {
    return false;
  }
}

function checkStateAccuracy(cientState, serverState){
  return true; //TODO make this actually work
}


//PLAYER JSON FRAMEWORK
/*
sess{
  visited:
  id:
}

Active_IDs {
  <id> {
    questions_seen:
    inProg:
    current_q:
    //New State stuff
    STATE: {
      q-reveal: false,
      inProg: false,
      answered: false,
    }
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


app.get("/", function(req, res){
  if(!req.query.answer){
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
        inProg: false,
        current_q: 0,
        STATE: {
          qreveal: false,
          inProg: false, //not in use rn, will switch over when appropriate
          answered: false
        }
      }
    }
    res.redirect('index.html');
  }else{
    console.log("query exists, forgoing new user process");
  }
});

app.use(express.static('public'));


app.get("/qs/:qid", function(req, res){
  res.send(tempQuestions[req.params.qid]);
});

app.get("/get-question", function(req, res){
  sess = req.session;
  console.log("questions seen" + Active_IDs[sess.id].questions_seen);
  Active_IDs[sess.id].current_q = Active_IDs[sess.id].current_q + 1;
  if(Active_IDs[sess.id].current_q <= tempQuestions.length){
    res.send(tempQuestions[Active_IDs[sess.id].current_q]);
  }else{
    res.send({question: "NO MORE QUESTIONS FOR TODAY",
              answer: "",
              link: ""});
  }
});

app.post("/index.html", function(req, res){
  sess = req.session;
  console.log(req.body);
  res.status(202).end();
  //res.redirect(req.get('referer'));
});

app.get("/get-state", function(req, res){
  sess = req.session;
  clientState = req.body.STATE;
  res.send(Active_IDs[sess.id].STATE);
});


//not in use yet
app.post("/change-state", function(req, res){
  sess = req.session;
  var serverState = Active_IDs[sess.id].STATE;
  var clientState = req.body.STATE;
  if(checkStateAccuracy(clientState, serverState)){
    var change = req.body.change;
    var changeVal = req.body.value;
    switch(change){
      case "answered":
        if(changeVal == true || changeVal == false){
          Active_IDs[sess.id].STATE["answered"] = changeVal;
        }
        break;

      case "qreveal":
        break;
    }
    return Active_IDs[sess.id].STATE;
  }
});

app.get("/getPlayerData", function(req, res){ //this will be deprecated after state fix
  sess = req.session;
  console.log(Active_IDs[sess.id]);
  res.send(Active_IDs[sess.id]);
});

app.get("/startQuiz", function(req,res){
  sess = req.session;

  if(Active_IDs[sess.id].inProg){

  }else{
    Active_IDs[sess.id].inProg = true;
  }
  res.send(Active_IDs[sess.id]);
});


var cache_array = JSON.parse(fs.readFileSync("caches/name-bank.json", "utf8").slice(0, -1)+"}");

/*function rebuildSentWCache(sentence, cache, update_cache){
  var sen_array = sentence.split(" ");
  var cache_upt = cache;
  var return_sen = "";
  if(update_cache){
    cache_upt = JSON.parse(fs.readFileSync("caches/name-bank.json", "utf8").slice(0, -1)+"}");
  }

  for(var word in sen_array){

    if(cache_upt[sen_array[word].toLowerCase()]){ // if the word is in the cache
      for(var item in cache_upt[sen_array[word].toLowerCase()]){ //loop through all the possible partner words
        if(sen_array[parseInt(word)+1].toLowerCase() == cache_upt[sen_array[word].toLowerCase()][item]){ //if the word matches a partner item
          sen_array[parseInt(word)] = sen_array[parseInt(word)] + "*%" + sen_array[parseInt(word) + 1];
          sen_array.splice(parseInt(word)+1, 1);
          break;
        }
      }
    }
    return_sen = return_sen + sen_array[word] + " "; //rebuild the sentence
  }
  return(return_sen.trim());
}
*/

//---------------Stuff for the data collection --------------
var dataset_file_path = "dataset/";
var dataset_file = "dataset.json";
var title_track = -1;
var label_array = [];

function addCache(name){
  var word_array = name.toLowerCase().split(" ");
  var words;
  for(var i=0; i<word_array.length; i++){
    var words = word_array.slice();
    words.splice(i, 1);
    fs.appendFile("caches/name-bank.json", '"'+ word_array[i]+ '":["'+ words +'"],', function (err) {
      if (err) throw err;
    });
  }
}

function getCap(sent_array){
  var cap_num = 0;
  for(var i=0; i<sent_array.length; i++){
    if(/^[A-Z]/.test(sent_array[i])){
      cap_num++;
    }
  }
  return cap_num;
}

function getCached(sent_array){
  var cache_num = 0;
  for(var i=0; i<sent_array.length; i++){
    if(sent_array[i].indexOf("*c")>-1){
      cache_num++;
    }
  }
  return cache_num;
}

function isCached(word){
  if(word.indexOf("*c")>-1){
    return true;
  }else{
    return false;
  }
}

function getDoubleCached(sent_array){
  var cache_num = 0;
  for(var i=0; i<sent_array.length; i++){
    if(sent_array[i].indexOf("*%")>-1){
      cache_num++;
    }
  }
  return cache_num;
}

function isDoubleCached(word){
  if(word.indexOf("*%")>-1){
    return true;
  }else{
    return false;
  }
}


function regex_dist_object(word_pos, sent_array, regex){
  var return_object = {};

  for(var key in regex){
      if(regex.hasOwnProperty(key)){
      var instance_num = 0;
      var tot_distance = 0;
      for(var j=0; j<sent_array.length; j++){
        if(regex[key].test(sent_array[j])){
          tot_distance = tot_distance + Math.abs(word_pos - j)
          instance_num++;
        }
      }
      if(instance_num > 0){
        return_object[key] = (tot_distance/instance_num);
      }else{
        return_object[key] = -1;
      }
    }
  }
  return(return_object);
}

function double_cached_dist(word_pos, sent_array){
  var instance_num = 0;
  var tot_distance = 0;
  var return_distance;
  for(var j=0; j<sent_array.length; j++){
    if(sent_array[j].indexOf("*%") > -1){
      tot_distance = tot_distance + Math.abs(word_pos - j)
      instance_num++;
    }
  }
  if(instance_num > 0){
    return_distance = (tot_distance/instance_num);
  }else{
    return_distance = -1;
  }
  return return_distance;
}

function cached_dist(word_pos, sent_array){
  var instance_num = 0;
  var tot_distance = 0;
  var return_distance;
  for(var j=0; j<sent_array.length; j++){
    if(sent_array[j].indexOf("*c")>-1){
      tot_distance = tot_distance + Math.abs(word_pos - j)
      instance_num++;
    }
  }
  if(instance_num > 0){
    return_distance = (tot_distance/instance_num);
  }else{
    return_distance = -1;
  }
  return return_distance;
}

function noun_dist(word_pos, sent_array, lexer, tagger){ //deprecated
  var noun_num = 0;
  var noun_distance = 0;
  var tagged_word;

  for(var i=0; i<sent_array.length; i++){
    tagged_word = tagger.tag(lexer.lex(sent_array[i]));
    if(["NN","NNP", "NNS", "NNPS"].indexOf(tagged_word[0][1]) > -1){
      noun_distance = noun_distance + Math.abs(word_pos - i)
      noun_num++;
    }
  }
  if(noun_num > 0){
    return noun_distance/noun_num;
  }else{
    return -1;
  }
}


function creatPointWithLabel(word_num, sentence, label, lexer, tagger){ //sentence must be in string form
  word = sentence.split(" ")[word_num];
  sentence_array = sentence.split(" ");
  regex_distances = regex_dist_object(word_num, sentence_array, {"digit": /\d/ , "capital": /[A-Z]/ });
  tagged_word = tagger.tag(lexer.lex(word));

  var data_point = {word: word,
                word_label: label,
                word_num: word_num,
                word_num_cont: (word.match(/\d+/g)!= null),
                word_length: word.length ,
                word_cap: /[A-Z]/.test( word[0]),
                word_symbol: (word.indexOf(":") > -1),
                word_pos: word_num/sentence_array.length,
                word_card_num: (["CD"].indexOf(tagged_word[0][1])>-1),
                word_noun: (["NN","NNP", "NNS", "NNPS"].indexOf(tagged_word[0][1]) > -1),
                word_hyph: (word.indexOf("-") > -1),
                word_cached: isCached(word),
                word_double_cache: isDoubleCached(word),
                sent_word_num: sentence_array.length,
                word_verb: (["VB","VBD", "VBG", "VBN", "VBP", "VBZ"].indexOf(tagged_word[0][1]) > -1),
                sent_$: sentence_array.indexOf("$") > -1,
                sent_hyph:(sentence.indexOf("-") > -1),
                sent_cap: getCap(sentence_array)/sentence_array.length,
                sent_num_cont: (sentence.match(/\d+/g)!= null),
                avg_dist_cap: regex_distances["capital"],
                avg_dist_digit: regex_distances["digit"],
                avg_dist_noun: noun_dist(word_num, sentence_array, lexer, tagger),
                avg_dist_cached: cached_dist(word_num, sentence_array),
                sent_cached: getCached(sentence_array)/sentence_array.length,
                double_cached_dist: double_cached_dist(word_num, sentence_array),
                sent_double_cached: getDoubleCached(sentence_array)/sentence_array.length
              };
    return data_point;
}





app.post("/sendLabel", function(req, res){
  if(req.body.labels){
    label_array = req.body.labels;
  }
  console.log(req.body.labels);
  res.send("labels recieved form server post 'sendLabel'");
});
app.get("/dataset.json", function(req, res){
  res.send("["+fs.readFileSync("dataset/dataset_full.json", "utf8").slice(0, -1)+"]");
});

app.get("/getTitle", function(req, res){
  if(title_track >= 0){
    console.log("title_track is now greater than 0");
    var word_lab;

    for(var i = 0; i<tempQuestions[title_track].title.split(" ").length; i++){

      if(label_array != []){
        if(label_array.indexOf(i.toString()) > -1){
          word_lab = true;
        }else{
          word_lab = false;
        }
      }

      fs.appendFile("dataset/dataset.json", JSON.stringify(creatPointWithLabel(i,tempQuestions[title_track].title, word_lab, lexer, tagger)) + ",", function (err) {
        if (err) throw err;
      });


    }
    console.log(label_array);

    //console.log(data_array);
  }
  label_array = [];
  console.log(label_array);

  title_track++;

  var sent = tempQuestions[title_track].title;
  //console.log(sent);
  res.send(sent.split(" "));
});


//-----------------------------------------------------------


app.post("/sendAnswer", function(req, res){
  sess = req.session;
  answer = req.body.answer;
  console.log("sendAnswer post recieved: "+ req.body.answer);
  Active_IDs[sess.id].questions_seen.push(Active_IDs[sess.id].current_q);

  res.send({
    correct: isCorrect(answer, sess),
    link: tempQuestions[Active_IDs[sess.id].current_q].link,
    answer: tempQuestions[Active_IDs[sess.id].current_q].answer,
    passage: tempQuestions[Active_IDs[sess.id].current_q].passage,
    source: tempQuestions[Active_IDs[sess.id].current_q].source
  });
});

app.get("/home", function(req, res){
  sess = req.session;
  if(Active_IDs[sess.id].inProg){
    Active_IDs[sess.id].inProg = false;
  }
  res.redirect("/index.html");
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
