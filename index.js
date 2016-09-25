// johnny-five - Library to control Arduino Board
var five = require("johnny-five");
var board = new five.Board();

// Sensors
var led, motion, buzzer;

// Twilio - SMS Provider
var twilio = require('twilio');
var client_twilio = twilio (
  'ACecffcadb4c0d69a1b51b00bf42341d5a', 
  '33a778f57515d3ef01cb5c25a70d9609');

// HTTP Module to Call Backend Api
var unirest = require('unirest');

// This var indicates how many times the alarm has been triggered
var times = 0;
// This var indicates the limit to trigger the alarm
var limit = 2 

board.on("ready", function() {

  // Create a new motion hardware instance.
  motion = new five.Motion(6);
  // Led indicator
  led = new five.Led(7);
  // Buzzer
  buzzer = new five.Piezo(4);
  buzzer.noTone(); // No sound at beginning

  // "calibrated" occurs once, at the beginning of a session,
  motion.on("calibrated", function() {
    console.log("calibrated");
  });

  // "motionstart" events are fired when the "calibrated"
  // proximal area is disrupted, generally by some form of movement
  motion.on("motionstart", function() {   
    times++;
    console.log("motionstart", times);
    // Chech if alarm should be triggered
    if(has_to_trigger()) {
        trigger_alarm();
    }
  });

  // "motionend" events are fired following a "motionstart" event
  // when no movement has occurred in X ms
  motion.on("motionend", function() {
    console.log("motionend");
    stop_alarm();
  });
});

function trigger_alarm(){
  //Reset Times Variable
  times= 0;
  // Led starting to blink
  led.blink();
  // Buzzer starting to play
  buzzer.frequency(6000, 500);

  // Json Object sended to Backend API
  var notification = {
  	messages: [
	  	{
		    article_id: "1",
		    motion: "true",
		    latitud: "84.4",
		    longitud: "5.4",
		    radius: "0"
	    }
    ]
  };

  // Sending data to Backed API
  unirest.post('https://heyiamhere.herokuapp.com/messages')
    .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
    .send(notification)
    .end(function (response) {

      // Json Object sended to Backend API
      var user = {
      	//phone: response.body.article.phone
        phone: "+573168120372",
        //article_name: response.body.article.name
        article_name: "Zanahoria"
      };
      //console.log(response.body);
      send_sms(user);
  });
}

// Check if alarm should be triggered
function has_to_trigger(){
  if(times == limit) {
      return true;
  }
  return false;
}

// Stop current active alarm
function stop_alarm(){
 //Led stopping to blink
  led.stop().off();
  // Buzzer stopping to play
  buzzer.noTone();
}

// Send SMS Messagge
function send_sms(user){
  client_twilio.messages.create({
    body: '***BiciCare*** te notifica, tu ' 
          + user.article_name
          + ' está en movimiento. Ingresa de' 
          + ' inmediato a nuestra aplicación para monitorear.',
    to: user.phone,
    from: '+14794312469' 
  }, function smsResults(err, msg){
    if (err){
      console.log('*** Error ***\n', err);
      return;
    }
    if(!msg.errorCode){
      console.log('> Success');
    } else {
      console.log('> Problem: %s', msg.errorCode);
    }
  });
  console.log('Sending SMS');
}
