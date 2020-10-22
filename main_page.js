window.onload = function(){
  document.getElementById("data-container").style.display = 'none';
  document.getElementById("chart-container").style.display = 'none';
  document.getElementById("side-container").style.display = 'none';
  document.getElementById("event-log").style.display = 'none';
  document.getElementById("card-container").style.display = 'block';
  document.getElementById("runButton").innerText = 'RUN SCRIPT';
}

  function navGraph(){
      document.getElementById("card-container").style.display = 'none';
      document.getElementById("chart-container").style.display = 'block';
      document.getElementById("runButton").innerText = 'RETURN HOME';
}

function goHome(){
  document.getElementById("data-container").style.display = 'none';
  document.getElementById("side-container").style.display = 'none';
  document.getElementById("chart-container").style.display = 'none';
  document.getElementById("event-log").style.display = 'none';
  document.getElementById("card-container").style.display = 'block';
  document.getElementById("runButton").innerText = 'RUN SCRIPT';
}
function runScript(){
   if(document.getElementById('runButton').innerText == 'RUN SCRIPT'){
     var API_SECRET = localStorage.getItem("SECRET_KEY");
     var API_KEY  = localStorage.getItem("API_KEY");
     var ls = new LongShort(API_KEY,API_SECRET);
     ls.init();
     ls.run();
   }
   else{
     goHome();
   }
}
function navPos(){
  document.getElementById("card-container").style.display = 'none';
  document.getElementById("side-container").style.display = 'block';
  document.getElementById("runButton").innerText = 'RETURN HOME';
}
function navTerminal(){
  document.getElementById("card-container").style.display = 'none';
  document.getElementById("event-log").style.display = 'block';
  document.getElementById("runButton").innerText = 'RETURN HOME';
}
