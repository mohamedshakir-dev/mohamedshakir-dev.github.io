function enter (){
  window.location.href = "animation.html";
}
function enter2 (){
  var apikey = document.getElementById("api-key").value;
  var secretkey = document.getElementById("secret-key").value;
  localStorage.setItem("API_KEY", apikey);
  localStorage.setItem("SECRET_KEY", secretkey);

  window.location.href = "main-page.html";
  // var API_KEY = $("#api-key").val();
  // var API_SECRET = $("#api-secret").val();
}

  // function f1() {
  //     alert("f1 called");
  //     //form validation that recalls the page showing with supplied inputs.
  // }
  // window.onload = function() {
  //     document.getElementById("enterButton").onclick = function clear() {
  //       window.location.href = "browser-trader.html";
  //         f1();
  //         //validation code to see State field is mandatory.
  //     }
  //}
   //  var x = document.getElementsByClassName("alert");
 //  console.log(x);
 // if (x.style.display === "none") {
 //   x.style.display = "block";
 // } else {
 //   x.style.display = "none";
 // }
//}
