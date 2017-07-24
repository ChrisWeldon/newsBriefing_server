var session = require('express-session');
var bodyParser = require('body-parser');
var fs = require("file-system");

module.exports = function(sentence, cache, update_cache){
  var sen_array = sentence.split(" ");
  var cache_upt = cache;
  var return_sen = "";
  var separators = [":", "'"]
  if(update_cache){
    cache_upt = JSON.parse(fs.readFileSync("caches/name-bank.json", "utf8").slice(0, -1)+"}");
  }
  var word_split;
  try{
    for(var word in sen_array){
      if(cache_upt[sen_array[word].toLowerCase()]){ // if the word is in the cache
        for(var item in cache_upt[sen_array[word].toLowerCase()]){ //loop through all the possible partner words
          if(sen_array[parseInt(word)+1].toLowerCase().split(new RegExp(separators.join('|'), 'g'))[0] == cache_upt[sen_array[word].toLowerCase()][item]){ //if the word matches a partner item
            sen_array[parseInt(word)] = "*c" + sen_array[parseInt(word)] + "*%" + sen_array[parseInt(word) + 1];
            sen_array.splice(parseInt(word)+1, 1);
            break;
          }else{
            sen_array[parseInt(word)] = "*c" + sen_array[parseInt(word)];
          }
        }
      }
      return_sen = return_sen + sen_array[word] + " "; //rebuild the sentence
    }
  }catch(err){
    console.log("cacher couldn't get word");
  }
  return(return_sen.trim());
}
