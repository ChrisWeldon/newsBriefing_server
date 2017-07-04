$(document).ready(function() {
  getTitle(false);
});

var labels = [];

function sendLabels(title){
  console.log("Labels sent: " + labels );
  $.post("/sendLabel", {labels: labels}, function(dat, stat){
    console.log("post sent and received for words: " + labels);
    if(title){
      console.log(dat);
      getTitle();
    }
    labels = [];
  });
}

function addLabel(word_num){
  labels.push(word_num);
}

function getTitle(){
  console.log("getTitle");
  $.getJSON("/getTitle", {}, function(dat,stat){
    console.log(dat);
    for(var i = 0; i<dat.length;i++){
      $('#title-div').append("<a href='javascript:addLabel("+ i +")'>" + dat[i] + " </a>");
    };
  });
}

$(document).keypress(function(e) {
    if(e.which == 13) {
        console.log("enter hit")
        $('#title-div').empty();
        sendLabels(true);
    }
});
