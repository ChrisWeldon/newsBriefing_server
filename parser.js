
parser("Ukraine says Russian sanctions must stay, rejects talk of *aTrump deal");

function parser(title){
  var pos = require('pos');

  var line = title.trim();
  var line_words = line.split(/[ ,]+/);
  titleProfile = {
    "sentence": line,
    "length": line.length,
    "word_num": line_words.length,
    "words":{}
  };

  // ID'ing the sentence and sorting the words
  function checkSymbol(symbols, word){
    var symbolPresent =false;
    var i;
    for(i=0; i<symbols.length; i++){
      if(word.indexOf(symbols[i])> -1){
        symbolPresent = true;
        break;
      }
    }
    if(symbolPresent){
      return symbols[i];
    }else{
      return false;
    }
  }
  var index;
  var spec_symbols = ["$"/*, "|", "-", "#", "&", "."*/];
  for(i=0; i<line_words.length;i++){
    index = "word_"+i;
    titleProfile.words[index] = { "word":line_words[i]};
    if(titleProfile.words[index].word.indexOf("*a")>-1){
      titleProfile.words[index].is_answer = true;
      titleProfile.words[index].word = titleProfile.words[index].word.replace("*a", "");
    }else{
      titleProfile.words[index].is_answer = false;
    }
    titleProfile.words[index].index = titleProfile.sentence.indexOf(line_words[i]);
    titleProfile.words[index].leng = line_words[i].length;
    titleProfile.words[index].order = i;
    titleProfile.words[index].spec_char = checkSymbol(spec_symbols, line_words[i]);
    if(/[0-9]+/.test(titleProfile.words[index].word)){
      titleProfile.words[index].number = true;
    }else{
      titleProfile.words[index].number = false;
    }
    titleProfile.words[index].capital = /[A-Z]+/.test(titleProfile.words[index].word);
    titleProfile.words[index].all_caps = /^[^a-z]*$/.test(titleProfile.words[index].word);
  }
  //console.log(titleProfile);

  //CREATING QUESTION WITH ID
  titleProfile.delete = false;
  var nix_words = ["who", "what", "when", "where", "why"];
  for(var i = 0; i<nix_words.length; i++){
    if(titleProfile.words.word_0.word == nix_words[i]){
      titleProfile.delete = true;
    }
  }

  var return_array = [];
  for(var i = 0; i< titleProfile.word_num; i++){
    index = "word_"+i;
    return_array[i] = {
                      "word": titleProfile.words[index].word,
                      "#": titleProfile.words[index].number,
                      "length": titleProfile.words[index].leng,
                      "capital": titleProfile.words[index].capital,
                      "noun": false,
                      "position": titleProfile.words[index].order/titleProfile.word_num,
                      "$": titleProfile.words[index].symbolPresent,
                      "abreviation": titleProfile.words[index].all_caps,
                      "is_answer": titleProfile.words[index].is_answer};
  }

  console.log(return_array);
  console.log("'#' 'length' 'capital' 'position' '$' 'appreviation' | 'is_answer'");
  for(var i = 0; i< return_array.length; i++){
    console.log(return_array[i]['#'] + " " + return_array[i].length + " " + return_array[i]['capital'] + " " + return_array[i]['position'] + " " + return_array[i]['$'] + " " + return_array[i]['abreviation'] + " | " + return_array[i]['is_answer']);
  }
}
