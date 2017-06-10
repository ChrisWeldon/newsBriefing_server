module.exports = function(title){
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
