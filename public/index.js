function startQuiz(){
  console.log("starQuize");
  $("#picture-underlay").addClass("slide-left");
}

function changeQ(){
  console.log("changeQ");
  $.getJSON("/get-question",{}, function(dat, stat){
    if(dat.playerData.quizInProg!=true){
      startQuiz();
    }

  });

}

function endQ(){
  console.log("endQ");
}
