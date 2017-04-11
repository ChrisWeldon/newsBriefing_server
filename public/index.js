

$(document).ready(function() {
  var playerData = $.getJSON("/getPlayerData",{}, function(dat, stat){
    console.log(dat);
    if(dat.inProg==true){
      startQuiz();
    }else{
      //make it so it shows questions already
    }
  });
});

function startQuiz(){
  console.log("startQuiz");
  $.getJSON("/startQuiz", {}, function(dat, stat){  //TODO combine this and /get player data with URL query
    $("#picture-underlay").addClass("slide-left");
    $("#start-form").addClass("fade-away");
    getQ();
  });
}
function getQ(){
  console.log("getQ");
  $.getJSON("/get-question",{}, function(dat, stat){
    console.log(dat);
    
  });
}
function endQ(){
  console.log("endQ");
}
