var curr_page = (typeof curr_page == 'undefined') ? "main_menu" : curr_page;

//Update the time in the upper right corner every second
window.setInterval(ShowTime, 1000);

//Update the MisterHouse mode icon in the upper left corner every minute
window.setInterval(function() { GetMhMode('header'); }, 60000);

//******************************************************************************
// This function is the jquery .ready function. Here we load the initial page 
// and get the current system mode icon and display it in the header
//******************************************************************************
$(function() {
  //App globals and settings
  $.ts = { };
  //Initialize webSocket object
  initWebSocket();
  //Load the initial page
  LoadPage(curr_page);
  //Get the current mh mode and display it
  GetMhMode('header');
});

//******************************************************************************
// This function loads a page into the content area
//
// @arg page_name - The name of the page to load
//******************************************************************************
function LoadPage(page_name) {
  $('#content').load('./' + page_name + '.html');
}

//******************************************************************************
// This function displays the time in the corner
//******************************************************************************
function ShowTime() {
  $("#hdrDateTime").html(formatAMPM());
}

//******************************************************************************
// This function sets the current page variable and loads the page
//
// @arg page_name - The name of the page to load
//******************************************************************************
function GoPage(page_name) {
  curr_page = page_name;
  LoadPage(page_name);
}

//******************************************************************************
// This function takes a temperature value and returns a hex rgb color value
// that relates to that temperature.  Colder values return cooler colors in the  
// blue spectrum, and hotter values return warmer colors in the red spectrum. 
//
// @arg temp - The temperature value to convert
// @arg fc - farenheit or celsius
//******************************************************************************
function Temp2RGB(temp, fc) {
  //Convert to farenheit if necessary
  temp = (fc == "C" || fc == "c") ? ((temp * 9 / 5) + 32) : temp;
  
  var RGB = '#000034';
  if (temp > 99) { RGB = '#670001'; } else
  if (temp > 91.5) { RGB = '#800000'; } else
  if (temp > 83.1) { RGB = '#990002'; } else
  if (temp > 74.6) { RGB = '#c22009'; } else
  if (temp > 66.1) { RGB = '#ee540e'; } else
  if (temp > 57.7) { RGB = '#fdca00'; } else
  if (temp > 49.2) { RGB = '#fcff68'; } else
  if (temp > 40.8) { RGB = '#fefefe'; } else
  if (temp > 32.3) { RGB = '#99cdff'; } else
  if (temp > 23.8) { RGB = '#3c9dd2'; } else
  if (temp > 15.4) { RGB = '#0066cb'; } else
  if (temp > 6.9) { RGB = '#003466'; } else
  if (temp > -1.5) { RGB = '#003466'; } 
  
  return RGB;
}

//******************************************************************************
// This function gathers the weather data and displays it on the right half of 
// the climate page.
//
//******************************************************************************
function updateWeather() {
  var url = './sub?json(weather)';
  var out = '';

  //get the weather data
  $.getJSON(url, function (data) {
    //we will get the US (F) or metric (C) value from the Summary_Short 
    var fc = data.Weather.Summary_Short.match(/^\d*\.?\d*?deg\;(F|C)/);

    //Now loop through the weather data
    $.each(data.Weather, function(key, value) {
      //check if we have a page element to update
      var el = $('#' + key);
      out += "["+key+"] = "+value+"\n";
      if (el.length > 0) {
        value = (value == "null") ? "?" : value;
        if (key.match(/^Temp/)) {
          el.html(value + "&deg; F");
          el.css('color', Temp2RGB(value, fc));
        } else if (key.match(/^Conditions/)) {
          el.css('height', '276px');
          //if the returned condition text contains spaces, replace them with underscores
          value = value.replace(/ /, "_");
          el.css('background-image', 'url(images/weather/' + value + '.png)');
          el.css('background-size', '256px 256px');
          el.css('background-repeat', 'no-repeat');
          el.css('background-position', 'center 20px');
        }
      }
    });
    //alert(out)
  });
}

//******************************************************************************
// This function is used to set the state of an  object in MisterHouse. If we 
// are setting the system mode (mode_occupied), then refresh the header icon for
// it after setting it. I am using an HTTP GET request as MH returns log 
// information that we don't want displayed, but we can possibly parse it for 
// errors returned 
//
// @arg obj - The MH object to change
// @arg state - the state to change it to
//******************************************************************************
function MhSet(obj, state) {
  var url='./set;Referrer?$' + obj + '=' + state;
  $.get(url, function (data) {
    //alert(data);
    if (obj == "mode_occupied") {
      GetMhMode("page");
    }
  });
}

//******************************************************************************
// This function gets the current mode that MH is in and also gets a list of the 
// availble modes MH uses.  Currently this should be Home, Work and Vacation
// modes. If calling to load the system mode page we will use the available 
// modes to build a table with the mode icons in a row with the icon for the 
// current active mode highlighted.  FOr all calls to this function, the current
// mode retrieved is used to update the current mode icon that is displayed in 
// the header. The ph="header" argument call is here for possible future use.
//
// @arg ph - either "page" or "header"
//******************************************************************************
function GetMhMode(ph) {
  var url = './sub?json(objects=mode_occupied)';

  //Get the current MH mode using a JSON call
  $.get(url, function (data) {
    var mode = data.objects.mode_occupied.state;
    var modes = data.objects.mode_occupied.states;
    var count = Object.keys(modes).length;

    if (ph == "page") {
      //we have requested a system mode page update
      var modesTable = '<table id="modesTable" style="width: 100%" data-transition="fade"><tbody>';
      modesTable += '<tr>';
    
      for (var i = 0;i < count; i++) {
        modesTable += '<td align="center">';
        if (modes[i] != mode) {
          modesTable += '<a href="javascript:MhSet(\'mode_occupied\', \'' + modes[i] + '\');">';
          modesTable += '<img src="images/icons/' + modes[i] + '_mode.png" alt="' + modes[i] + ' mode" width="200" height="200">';
          modesTable += '</a>';
        } else {
          modesTable += '<img src="images/icons/' + mode + '_mode_active.png" alt="Current mode" width="200" height="200" />';
        }
        modesTable += '</td>';
      }
      modesTable += '</tr>';
      modesTable += '</tbody></table>';

      $('#modesList').html(modesTable);
    }
    //Even if we make a call for a system mode page update we might as well update the header image since we have the data
    var modeHdr= '<img src="images/icons/' + mode + '_mode_small.png" alt="' + mode + ' mode" width="32" height="32">';
    $('#hdrMode').html(modeHdr);
  });
}

//******************************************************************************
// This function generates the time string that is displayed in the upper right
// corner of the window.
//******************************************************************************
function formatAMPM() {
  var d = new Date(),
  minutes = d.getMinutes().toString().length == 1 ? '0'+d.getMinutes() : d.getMinutes(),
  hours = d.getHours() > 12 ? d.getHours() - 12 : d.getHours(),
  ampm = d.getHours() >= 12 ? 'pm' : 'am',
  months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  
  return days[d.getDay()]+' '+months[d.getMonth()]+' '+d.getDate()+' '+d.getFullYear()+' '+hours+':'+minutes+ampm;
}


//******************************************************************************
// webSocket object
//
// define some constants for later use
// initialize webSocket object and methods
// create a websocket connection and define its event functions
//
// Sean Mathews 
//   coder at f34r dot com
//
//******************************************************************************
function initWebSocket()
{
  // create our connection url and add to our touchscreen(ts) object
  $.ts.wsUri = "ws://" + window.location.hostname + ":3000/"; 

  // start the connection. async so it wont happen just yet
  $.ts.webSocket = new WebSocket($.ts.wsUri);

  // connect establish event
  $.ts.webSocket.onopen = function(evt) {
    console.log("WebSocket connected");
  };

  // connection close event
  $.ts.webSocket.onclose = function(evt) {
    console.log("WebSocket closed");
  };

  // connection message event
  $.ts.webSocket.onmessage = function(evt) {
    console.log("WebSocket message: " + evt.data);
    if(evt.data === "RESTART") {
       alert("mh just told me it restarted. Is all ok?");
    }
  };

  // connection error event
  $.ts.webSocket.onerror = function(evt) {
    console.log("WebSocket connected");
  };

  // sendToMH send a json message to MH
  // 
  //   var msg = {
  //     event: "click",
  //     data: "power"
  //   };
  //   $.ts.webSocket.sendToMH(msg);
  // 
  $.ts.webSocket.sendToMH = function (msg) {
    console.log("WebSocket sendToMH");
    $.ts.webSocket.send(JSON.stringify(msg));
  };
}

