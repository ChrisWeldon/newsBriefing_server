
$(document).ready(function() {
  var playerData = $.getJSON("/getPlayerData",{}, function(dat, stat){
    console.log(dat);
    if(dat.inProg==true){
      startQuiz();
    }else{
      getQ();
    }
  });
});



function startQuiz(){
  console.log("startQuiz");
  $.getJSON("/startQuiz", {}, function(dat, stat){  //TODO combine this and /get player data with URL query
    getQ();
  });
}

function getQ(callback){
  console.log("getQ");
  $.getJSON("/getPlayerData", {}, function(p_dat, stat){
    $.getJSON("/get-question", {}, function(dat, stat){
      var q = dat.question;
      var bnum = Array(dat.answer.length).join(String.fromCharCode(127));
      q = q.replace("*a","<span id='q-blank'><span id='q-hint'></span>"+bnum + "</span>");
      $("#question").empty();
      $("#question").append(q);
      if(arguments.length > 0){
        callback();
      }
    });
  });
}


$(document).keypress(function(e) {
    if(e.which == 13) {
      if(document.getElementById("q-answer").value.length > 0){
        sendAnswer();
      }
    }
});

function sendAnswer(){
  console.log("sendAnswer was called");
  $.post("/sendAnswer", {answer: document.getElementById("q-answer").value}, function(dat, stat){
    // $("#q-answer").addClass("disabled");
    // $(".gbutton").addClass("disabled");
    // $("#nextbtn").removeClass("disabled");


    $("#answer-pass").text(function(){
      if(dat.correct){
        return "CORRECT";
      }else{
        return "INCORRECT";
      }
    });
    $("#q-blank").text(dat.answer);
    $("#q-blank").css("color", function(){
      if(dat.correct){
        return "green";
      }else{
        return "red";
      }
    });
    $("#answer-link").text(dat.link);
    $("#answer-link").attr("href", dat.link);
    
    $("#answer-div").removeClass("fadeOutRight");
    void $("answer-div").offsetWidth;
    $("#answer-div").addClass("fadeInLeft");
  });
}
function next(){
  getQ(function(){

    console.log("next callback called");
    // $("#q-answer").removeClass("disabled");
    // $(".gbutton").removeClass("disabled");
    // $("#answer-pass").removeClass("answer-appear");
    $("#answer-div").removeClass("fadeInLeft");
    void $("answer-div").offsetWidth;
    $("#answer-div").addClass("fadeOutRight");
  });
}



function skip(){

}
function exit(){

}

function endQ(){}
