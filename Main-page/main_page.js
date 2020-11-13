/*
  Scripts used to control navigation for the main page.
*/

// Onload functions, formats page properly when first loaded.
window.onload = function(){
  // document.getElementById("").style.display = 'none';
  document.getElementById("chart-container").style.display = 'none';
  document.getElementById("position-order-container").style.display = 'none';
  document.getElementById("event-log").style.display = 'none';
  document.getElementById("settingsCard").style.display = 'none';
  document.getElementById("card-container").style.display = 'block';
  document.getElementById("askLogout").style.display = 'none';
  document.getElementById("runButton").style.marginTop = "0px";
  document.getElementById("killButton").style.marginTop = "0px";
  document.getElementById("runButton").innerText = 'RUN SCRIPT';
}
// Toggles light and dark mode.
function switchBackground(){
  document.body.classList.toggle("light-mode");
}

// Navigates to settings by hiding certain elements and showing others
function openSetting(){
      document.getElementById("card-container").style.display = 'none';
      document.getElementById("header-container").style.display = 'none';
      document.getElementById("settings").style.display = 'none';
      document.getElementById("settingsCard").style.display = 'block';
}
// Navigates to graph by hiding certain elements and showing others
  function navGraph(){
      document.getElementById("card-container").style.display = 'none';
      document.getElementById("settings").style.display = 'none';
      document.getElementById("chart-container").style.display = 'block';
      document.getElementById("runButton").style.marginTop = "5%";
      document.getElementById("killButton").style.marginTop = "5%";
      document.getElementById("runButton").innerText = 'RETURN HOME';
}
// Returns home by hiding certain elements and showing others
function goHome(){
  // document.getElementById("").style.display = 'none';
  document.getElementById("position-order-container").style.display = 'none';
  document.getElementById("chart-container").style.display = 'none';
  document.getElementById("event-log").style.display = 'none';
  document.getElementById("settingsCard").style.display = 'none';
  document.getElementById("card-container").style.display = 'block';
  document.getElementById("header-container").style.display = 'block';
  document.getElementById("settings").style.display = 'block';
  document.getElementById("runButton").style.marginTop = "0px";
  document.getElementById("killButton").style.marginTop = "0px";
  document.getElementById("runButton").innerText = 'RUN SCRIPT';
}

/*
  runScript function checks the inner HTML text value of the runScript button.
  If the text value is run script, it will call the run function and pass it the
  parameters. Else it will call the goHome function and format the page.
*/
function runScript(){
   if(document.getElementById('runButton').innerText == 'RUN SCRIPT'){
     var API_SECRET = localStorage.getItem("SECRET_KEY");
     var API_KEY  = localStorage.getItem("API_KEY");
     var ls = new Alpaca(API_KEY,API_SECRET);
     ls.init();
     ls.run();
   }
   else{
     goHome();
   }
}

// Navigates to the positions card by hiding certain elements and showing others
function navPos(){
  document.getElementById("settings").style.display = 'none';
  document.getElementById("card-container").style.display = 'none';
  document.getElementById("position-order-container").style.display = 'block';
  document.getElementById("runButton").style.marginTop = "5%";
  document.getElementById("killButton").style.marginTop = "5%";
  document.getElementById("runButton").innerText = 'RETURN HOME';
}

// Navigates to terminal by hiding certain elements and showing others
function navTerminal(){
  document.getElementById("settings").style.display = 'none';
  document.getElementById("card-container").style.display = 'none';
  document.getElementById("event-log").style.display = 'block';
  document.getElementById("runButton").style.marginTop = "5%";
  document.getElementById("killButton").style.marginTop = "5%";
  document.getElementById("runButton").innerText = 'RETURN HOME';
}

// Displays logout confirmation menu so the user has a chance to go back or confirm logout
function askLogout(){
  document.getElementById("settingsCard").style.display = 'none';
  document.getElementById("askLogout").style.display = 'block';
}

//Executes logout by navigating back to the login screen and killing script.
function logout(){
  window.location.href = "../Login Page/login.html";
  ls.kill();
}

// Returns back to the settings card if the user cancels the logout
function goBack(){
  document.getElementById("askLogout").style.display = 'none';
  document.getElementById("settingsCard").style.display = 'block'
}

/*
Alerts user before unloading page to insure they are aware of the risks of navigating away while
the script is running.
*/
window.onbeforeunload = function() {
  return " ";
}
