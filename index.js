var model = undefined;
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const liveView = document.getElementById('liveView');

const synth = window.speechSynthesis;

function getUserMediaSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function enableCam(event) {
    const constraints = {
        video: true
    };

    //i'm guessing the stream parameter comes from getUserMedia?
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        video.srcObject = stream;
        //need to wait until data is loaded 
        //otherwise the tensorflow model (predictWebcam function) will try to read an empty image frame (basically undefined)
    });
}

function captureScreenshot() {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
}

var children = [];
function predict() {
    if (!model) {
        console.log("No model");
    }
    else {
        model.detect(canvas).then(function(predictions) {
            console.log('hellow world');
            for (let i = 0; i < children.length; i++) {
                liveView.removeChild(children[i]);
            }
            children.splice(0);
    
            //now looping through predictions and filtering based on confidence score
            for (let n = 0; n < predictions.length; n++) {
                if (predictions[n].score > 0.66) {
                    console.log(predictions[n].class);
                    const p = document.createElement('p');
                    p.innerText = predictions[n].class + ' - with ' + Math.round(parseFloat(predictions[n].score) * 100) + '% confidence';
                    p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: ' + (predictions[n].bbox[1] - 25) + 'px; width: ' + (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';
    
                    const highlighter = document.createElement('div');
                    const prediction = new SpeechSynthesisUtterance(String(predictions[n].class));
                    const voices = synth.getVoices();
                    prediction.voice = voices[0];
                    prediction.pitch = 1;
                    prediction.rate = 1;
                    prediction.voiceURI = 'native';
                    prediction.volume = 1;
                    prediction.lang = 'en-US';

                    highlighter.setAttribute('class', 'highlighter');
                    highlighter.setAttribute('data-object', predictions[n].class);
                    highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: ' + predictions[n].bbox[1] + 'px; width: ' + predictions[n].bbox[2] + 'px; height: ' + predictions[n].bbox[3] + 'px;';
                    highlighter.addEventListener('click', function() {
                        console.log('hello');
                        synth.speak(prediction);
                    });

                    liveView.appendChild(highlighter);
                    liveView.appendChild(p);
                    children.push(highlighter);
                    children.push(p);
                }
            }
        });
    }
}

//-------------------------------------------------------------------------------------------------------------------------------------------

$(document).ready(function() {
    cocoSsd.load().then(function(loadedModel) {
        model = loadedModel;
    });

    if (getUserMediaSupported()) {
        $('#webcamButton').click(enableCam);
        $('#screenshotButton').click(function() {
            captureScreenshot();
            predict();
        });
    }
    else {
        console.warn('getUserMedia() is not supported by browser');
    }
});