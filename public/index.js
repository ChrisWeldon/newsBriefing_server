
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
  $.getJSON("/getPlayerData", {}, function(p_dat, stat){
    $.getJSON("/get-question", {}, function(dat, stat){
      console.log(p_dat);
      console.log(dat);
      var q = dat.question;
      var bnum = Array(dat.answer.length).join(String.fromCharCode(127));
      q = q.replace("*a","<span id='q-blank'><span id='q-hint'></span>"+bnum + "</span>");
      $("#question").empty();
      $("#question").append(q);
      $("#picture-underlay").addClass("slide-left");
      $("#start-form").addClass("fade-away");
      console.log(dat);
    });
  });
}
//override for callback function
/*function getQ(callback){
  console.log("getQ");
  $.getJSON("/get-question", {}, function(dat, stat){
    var q = dat.question;
    var bnum = Array(dat.answer.length).join(String.fromCharCode(127));
    q = q.replace("*a","<span id='q-blank'>"+bnum + "</span>");
    $("#question").empty();
    $("#question").append(q);
    $("#picture-underlay").addClass("slide-left");
    $("#start-form").addClass("fade-away");
    console.log(dat);
    callback();
  });
}*/

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
    $("#q-answer").attr("disabled", "disabled");
    $(".gbutton").attr("disabled", "disabled");
    $("#nextbtn").removeAttr("disabled");
    $("#answer-pass").addClass("answer-appear").text(function(){
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
    $("#answer-link").addClass("answer-appear").text(dat.link);
    $("#answer-link").attr("href", dat.link)
    $("#answer-passage").addClass("answer-appear").text("passage from article coming soon");

    $("#nextbtn").addClass("fade-in")
  });
}
function next(){
  getQ(function(){
    $("#q-answer").removeAttr("disabled");
    $(".gbutton").removeAttr("disabled");
    $("#q-answer").removeClass("answer-appear");
    $("#answer-link").removeClass("answer-appear");
    $("#answer-pass").removeClass("answer-appear");
    $("#answer-passage").removeClass("answer-appear");
    $("#nextbtn").attr("disabled", "disabled");
    $("#nextbtn").removeClass("fade-in");
  });
}



function skip(){

}
function exit(){

}

function endQ(){}
