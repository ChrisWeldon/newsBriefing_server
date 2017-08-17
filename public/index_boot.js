
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
    }).css("color", function(){
      if(dat.correct){
        return "green";
      }else{
        return "red";
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
    console.log(dat);
    if(dat.passage.length>0){
        $("#passage").text(dat.passage);
    }else{
      $("#passage").text("");
    }
    if(dat.passage.length>0){
        $("#source").text("\u2013 " +  dat.source);
        $("#passage-panel").removeClass("fadeOut");
        void $("answer-div").offsetWidth;
        $("#passage-panel").addClass("fadeIn");
    }
    $("#answer-div").removeClass("fadeOutDown");
    void $("answer-div").offsetWidth;
    $("#answer-div").addClass("fadeInDown");


    $("#q-answer").attr("disabled", "disabled");
    $("#answer-btn").attr("disabled","disabled");
    $("#nextbtn").removeAttr("disabled");
  });
}
function next(){
  getQ(function(){

    console.log("next callback called");
    $("#q-answer").removeAttr("disabled");
    $("#answer-btn").removeAttr("disabled");
    $("#nextbtn").attr("disabled", "disabled");
    $("#q-answer").val("");
    $("#answer-div").removeClass("fadeInDown");
    void $("#answer-div").offsetWidth;
    $("#answer-div").addClass("fadeOutDown");
    $("#passage-panel").removeClass("fadeIn");
    void $("#answer-div").offsetWidth;
    $("#passage-panel").addClass("fadeOut");
  });
}



function skip(){

}
function exit(){

}

function endQ(){}
