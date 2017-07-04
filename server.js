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

console.log("lev distance : "+ levDistance("Donald", "Eric"));
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


var surveySize = 24;

crawlWorldNews = function(callback){
  var pageToVisit = "https://www.reddit.com/r/worldnews/";
  var finalQs;
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
       finalQs = collectArticles($, callback);
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

collectArticles = function($, callback) {
  SERVER_STATE = "UPDATING_ARTICLES";
  var cycleCount = 0;
  var titleLinks = $("a[class^='title may-blank outbound']");
  var finishedPushing = false;
  titleLinks.each(function() {
      var url = $(this).attr('href');

      if(false){
        return;
      }else{
        request(url, function(error, response, body){
          if(error) {
            console.log("Error: " + error);       // Check status code (200 is HTTP OK)
          }else if(response.statusCode === 200) { //console.log("Status code: " + response.statusCode);
            // Parse the document body
            var tempTitle = {};
            var $ = cheerio.load(body);
            var articleQInfo = parseTitle($('title').text());
            //console.log("ARTICLE Page title:  " + $('title').text());
            tempTitle["link"] = url;
            tempTitle["title"] = articleQInfo["input"];
            tempTitle["question"] = articleQInfo["question"];
            tempTitle["answer"] = articleQInfo[0];
            console.log("no problem connecting indivdual articles #" + cycleCount);
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
  console.log("generating ID");
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

  res.send(tempQuestions[Active_IDs[sess.id].current_q]);
  //TODO rework
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
//---------------Stuff for the data collection --------------
var pos = require('pos');
var dataset_file_path = "dataset/";
var dataset_file = "dataset.json";
var data_point = {};
var title_track = -1;
var label_array = [];

function cap_dist(word_pos, sent_array){
  var cap_num = 0;
  var cap_distance = 0;
  for(var i=0; i<sent_array.length; i++){
    if(/^[A-Z]/.test(sent_array[i])){
      console.log("word "+ i + " is capitalized");
      cap_distance = cap_distance + Math.abs(word_pos - i)
      cap_num++;
    }
  }
  if(cap_num > 0){
    return cap_distance/cap_num;
  }else{
    return 0;
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

function digit_dist(word_pos, sent_array){
  var digit_num = 0;
  var digit_distance = 0;
  for(var i=0; i<sent_array.length; i++){
    if(/\d+/g.test(sent_array[i])){
      console.log("word "+ i + " is a digit");
      digit_distance = digit_distance + Math.abs(word_pos - i)
      digit_num++;
    }
  }
  if(digit_num > 0){
    return digit_distance/digit_num;
  }else{
    return 0;
  }
}


app.post("/sendLabel", function(req, res){
  if(req.body.labels){
    label_array = req.body.labels;
  }
  console.log(req.body.labels);
  res.send("labels recieved form server post 'sendLabel'");
});
app.get("/dataset.json", function(req, res){
  res.send("["+fs.readFileSync("dataset/dataset.json", "utf8").slice(0, -1)+"]");
});

app.get("/getTitle", function(req, res){
  if(title_track >= 0){
    console.log("title_track is now greater than 0");
    var word_lab;
    var word;
    var tagged_word;



    var lexer = new pos.Lexer()
    var tagger = new pos.Tagger();


    for(var i = 0; i<tempQuestions[title_track].title.split(" ").length; i++){
      word = tempQuestions[title_track].title.split(" ")[i];
      tagged_word = tagger.tag(lexer.lex(word));

      if(label_array != []){
        if(label_array.indexOf(i.toString()) > -1){
          word_lab = true;
        }
      }else{
        word_lab = false;
      }
      data_point = {word: word,
                    word_label: word_lab,
                    word_num: i,
                    word_num_cont: (word.match(/\d+/g)!= null),
                    word_length: word.length ,
                    word_cap: /[A-Z]/.test( word[0]),
                    word_percent_symbol: (word.indexOf("%") > -1),
                    word_pos: i/tempQuestions[title_track].title.split(" ").length,
                    word_card_num: (["CD"].indexOf(tagged_word[0][1])>-1),
                    word_noun: (["NN","NNP", "NNS", "NNPS"].indexOf(tagged_word[0][1]) > -1),
                    sent_word_num: tempQuestions[title_track].title.split(" ").length,
                    sent_word_verb: (["VB","VBD", "VBG", "VBN", "VBP", "VBZ"].indexOf(tagged_word[0][1]) > -1),
                    sent_$: tempQuestions[title_track].title.indexOf("$") > -1,
                    sent_percent_symbol:(word.indexOf("%") > -1),
                    word_hyph: (word.indexOf("-") > -1),
                    sent_cap: getCap(tempQuestions[title_track].title.split(" "))/tempQuestions[title_track].title.split(" ").length,
                    sent_num_cont: (tempQuestions[title_track].title.match(/\d+/g)!= null),
                    avg_dist_cap: cap_dist(i, tempQuestions[title_track].title.split(" ")),
                    avg_dist_digit: digit_dist(i, tempQuestions[title_track].title.split(" "))
                  };

      fs.appendFile("dataset/dataset.json", JSON.stringify(data_point) + ",", function (err) {
        if (err) throw err;
        console.log("data point appended: "+ data_point);
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
    answer: tempQuestions[Active_IDs[sess.id].current_q].answer
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
