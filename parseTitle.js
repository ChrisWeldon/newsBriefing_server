rebuildSentWCache = require("./cacher");
var fs = require("file-system");

//var spawn = require("child_process").spawn

module.exports = function(title, tagger, lexer){
  return new Promise(function(resolve, reject){
    var sent = title //rebuildSentWCache(title, cache_array, false);
    var fills = {};
    var returnArray = [];
    var word_num;
    var tagged_word;
    var data_points = [];
    var spawn = require("child_process").spawn;
    var py = spawn('python3', ['parse_title_3.0.py']);

    py.stdout.on('data', function(data){

      data = parse_python_array(data.toString('utf8'));


      var answers = [];
      for(var i=0; i < data.length; i++){
        if(data[i] == true){
          answers.push(i);
        }
      }
      var rand = Math.floor(Math.random() * answers.length)

      fills["input"] = sent;
      fills["question"] = title.replace(title.split(" ")[answers[rand]], "*a");
      fills["answer"] = title.split(" ")[answers[rand]]//title.split(" ")[answers[rand]];
      resolve(fills);

    });

    py.stdout.on('end', function(){
    });

    py.stdout.on('error', function(err){
      console.log("PYTHON ERROR: " + err);
      reject("PYTHON ERROR: " + err);
    });

    for(var i = 0; i < sent.split(" ").length; i++){
      var word_num = i;

      word = sent.split(" ")[i];
      sent_array = sent.split(" ");
      tagged_word = tagger.tag(lexer.lex(word));
      regex_distances = regex_dist_object(word_num, sent_array, {"digit": /\d/ , "capital": /[A-Z]/ });
      //py = spawn('python3', ['parse_title_3.0.py']);
      point = {
              word_num: word_num,
              word_num_cont: (word.match(/\d+/g)!= null),
              word_length: word.length ,
              word_cap: /[A-Z]/.test( word[0]),
              word_pos: word_num/sent_array.length,
              word_card_num: (["CD"].indexOf(tagged_word[0][1])>-1),
              word_noun: (["NN","NNP", "NNS", "NNPS"].indexOf(tagged_word[0][1]) > -1),
              word_hyph: (word.indexOf("-") > -1),
              word_cached: isCached(word),
              word_double_cache: isDoubleCached(word),
              sent_word_num: sent_array.length,
              word_verb: (["VB","VBD", "VBG", "VBN", "VBP", "VBZ"].indexOf(tagged_word[0][1]) > -1),
              sent_$: sent_array.indexOf("$") > -1,
              sent_hyph:(sent.indexOf("-") > -1),
              sent_cap: getCap(sent_array)/sent_array.length,
              avg_dist_cap: regex_distances["capital"],
              avg_dist_noun: noun_dist(word_num, sent_array, lexer, tagger),
              avg_dist_cached: cached_dist(word_num, sent_array),
              sent_cached: getCached(sent_array)/sent.length,
              sent_double_cached: getDoubleCached(sent_array)/sent_array.length
            };
      data_points.push(point);
    }

    py.stdin.write(JSON.stringify(data_points));
    py.stdin.end();
  });
}

//------------------------Functions to be modulated----------------------

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

function parse_python_array(str){
  str = str.replace("[", "");
  str = str.replace("]","");
  str = str.replace(/\n/g,"");
  var str_array = str.split(" ");
  var return_array = []
  for(var i=0; i<str_array.length; i++){
    if(str_array[i] == "True"){
      return_array.push(true);
    }else if(str_array[i]=="False"){
      return_array.push(false);
    }
  }
  return return_array;
}
