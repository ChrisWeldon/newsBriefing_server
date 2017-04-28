

$(document).ready(function() {
  var playerData = $.getJSON("/getPlayerData",{}, function(dat, stat){
    console.log(dat);
    if(dat.inProg==true){
      startQuiz();
    }else{
    }
  });
});

function startQuiz(){
  console.log("startQuiz");
  $.getJSON("/startQuiz", {}, function(dat, stat){  //TODO combine this and /get player data with URL query
    getQ();
  });
}

function openMenu(){
  console.log("revealMenu");
  $("#content-sidebar").addClass("hide-menu");
}

function getQ(){
  console.log("getQ");
  $.getJSON("/get-question", {}, function(dat, stat){
    var q = dat.question;
    var bnum = Array(dat.answer.length).join("_");
    q = q.replace("*a",bnum);
    $("#question").text(q);
    $("#picture-underlay").addClass("slide-left");
    $("#start-form").addClass("fade-away");
    console.log(dat);
  });
}
function sendAnswer(){
  console.log("sendAnswer");
  $.getJSON("/sendAnswer", {q:$("q-answer").value}, function(dat, stat){

  });
}
function skip(){

}
function exit(){

}

function endQ(){}
