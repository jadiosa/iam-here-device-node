var five = require("johnny-five");
var board = five.Board();

board.on("ready",function() {
	rotary = new five.Sensor("A0");
	var led = new five.Led(6);

	rotary.scale(0, 255).on("change", function(){
		led.brightness(this.value);
	});
	
});