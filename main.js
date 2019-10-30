var WebSocketClient = require('websocket').client;
var Gpio = require('onoff').Gpio;
var client = new WebSocketClient();
var amp = new Gpio(13,'out');

var speaking = false;
var playing = false;
var detecting = false;
var detectingTimeout = 0;

function updateAmp(){

    if(speaking || playing || detecting){
        console.log("amp on");
        amp.writeSync(0);
    }
    else {
        console.log("amp off");
        amp.writeSync(1);
    }

}

function startConnect(){
    client.connect('ws://127.0.0.1:8181/core');
}


function handleMessage(message){
    var type =  JSON.parse(message['utf8Data']).type;
    console.log("Got message type "+type);
    switch(type){
        case "mycroft.audio.service.play":
            playing = true;
            break;
        case "mycroft.audio.service.stop":
            playing = false;
            break;
        case "recognizer_loop:audio_output_start":
            speaking = true;
            break;
        case "recognizer_loop:audio_output_end":
            speaking = false;
            break;
        case "recognizer_loop:wakeword":
            detecting = true;
            if(detectingTimeout){
                clearTimeout(detectingTimeout); 
            }

            detectingTimeout = setTimeout(function(){
                detecting = false;
                detectnigTimeout = 0;
                updateAmp();
	    }, 2000);
            break;
        default:
            return;
    }

    console.log("AUDIO MSG " + type);
    updateAmp();
}


function disconnect(){
    console.log("disconnected from mycroft message bus");
    setTimeout(startConnect, 0);
}

client.on('connectFailed', function(error){
    //console.log("Connection error" + error);
    setTimeout(startConnect, 1000);   
});

client.on('connect', function(connection){
    console.log("connected to mycroft message bus");
    connection.on('message', handleMessage);
    connection.on("close", disconnect);
});

setTimeout(startConnect, 0);

