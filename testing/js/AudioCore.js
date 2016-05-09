/**
 * @author John McCain <johnm.freestate@gmail.com>
 * @version 1.0
 */

/**
 * @type {AudioContext}
 */
var audioContext;

/**
 * The currently selected instrument for editing
 * @type {object}
 */
var currentInstrument;

/**
 * Array of all the instruments
 * @type {array}
 */
var instruments = Array();

/**
 * Timer for each beat
 * @type {Timer}
 */
var beatTimer;

/**
 * The current BPM (beats per minute) of the drum machine.  Note: a beat is 4 steps in this drum machine.
 * @type {number}
 */
var tempo;

/**
 * Beat iterator (valid values are integers from 0-15)
 * @type {number}
 */
var beat = 0;

/**
 * Gain node for the master volume
 * @type {gainnode}
 */
var masterVolume;

window.addEventListener('load', setup, false);

/**
 * Loads the buffers, sets up the instruments, creates the knobs, and sets the current instrument to the BD
 */
function setup() {
    try {
        incrementLoadingProgress();
        beatTimer = new Timer(function() {
            onBeat();
        }, 107.142857143);

        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();

        //set up master volume gain node
        masterVolume = audioContext.createGain();
        masterVolume.connect(audioContext.destination);
        masterVolume.gain.value = .6;

        var masterVolumeKnob = document.getElementById('volume-knob');
        knobbify(masterVolumeKnob, '#55FF55');
        var jVolumeKnob = $(masterVolumeKnob).data('jknob');
        jVolumeKnob.gainNode = masterVolume;
        jVolumeKnob.getValue = function() {
            return this.position / 300;
        };
        jVolumeKnob.onValueChange = function() {
            this.gainNode.gain.value = this.getValue();

        };

        //set up the tempo knob
        var tempoKnob = document.getElementById('tempo-knob');
        knobbify(tempoKnob);
        var jTempoKnob = $(tempoKnob).data('jknob');
        jTempoKnob.getValue = function() {
            return ((this.position / 1.8) + 40); //Possible values: 40-200bpm
        };
        jTempoKnob.onValueChange = function() {
            setTempo(this.getValue());
        };

        //Bind keys
        $(window).bind('keyup', function(key) {
            if (key.which == 32) //Space Bar -> Play/Pause
            {
                playPause();
                key.preventDefault();
            }

        });

        /* buffers */
        loader = new MyBufferLoader(
            audioContext,
            BufferLists,
            function(buffers) {
                for (var i = 0; i < buffers.length; ++i) {
                    incrementLoadingProgress();
                    /* knobs */
                    var numKnobs = 0;
                    for (var x = 0; x >= 0; ++x) {
                        if (Math.pow(5, x) <= buffers[i].length) {
                            numKnobs = x;
                        } else {
                            x = -100;
                        }
                    }

                    gain = audioContext.createGain();
                    gain.connect(masterVolume);

                    gain.gain.value = .6;


                    var gainKnob = makeKnob('#5555FF');
                    var jGainKnob = $(gainKnob).data('jknob');
                    jGainKnob.gainNode = gain;
                    jGainKnob.getValue = function() {
                        return this.position / 300;
                    };
                    jGainKnob.onValueChange = function() {
                        this.gainNode.gain.value = this.getValue();
                    };
                    $(channels[i]).prepend($(gainKnob).fadeIn('fast'));

                    var knobs = Array();
                    for (var j = 0; j < numKnobs; ++j) {
                        var knob = makeKnob('#FF5555');
                        knobs[j] = $(knob).data('jknob');
                        $(channels[i]).prepend($(knob).fadeIn('fast'));
                    }
                    console.log('Made ' + numKnobs + ' knobs.  Actual length of knobs: ' + knobs.length);
                    //Create the instrument
                    instruments[i] = new Instrument(buffers[i], knobs, gain);
                }

                currentInstrument = instruments[0];
            }
        );
        loader.load();
    } catch (exception) {
        console.trace();
        console.log(exception);
        alert("HTML5 audio is not supported in your browser.");
    }
}

/**
 * Change the currentInstrument to the instrument at index in instruments
 * @param {number} index - The index of the instrument to select
 */
function selectInstrument(index) {
    currentInstrument = instruments[index];
    updateLeds();
}

/**
 * Increment the sequence of the currentInstrument at index (will always be between 0-1, eventually 0-2)
 * @param {number} index - The index of the sequence to change (valid values are 1-15)
 */
function changeBeat(index) {
    currentInstrument.sequence[index] = (currentInstrument.sequence[index] + 1) % 2;
}

/**
 * Set the BPM of the drum machine.  Updates the current BPM and the beatTimer interval
 * @param {number} newTempo - The new tempo of the drum machine in beats per minute
 */
function setTempo(newTempo) {
    tempo = newTempo;
    console.log('Changed tempo to ' + tempo);
    beatTimer.setInterval(15000 / newTempo);
}

/**
 * Called when the play/pause button is pressed or the spacebar is pressed.  Calls start() if the TR808 is stopped, calls stop() otherwise
 */
function playPause() {
    if (beatTimer.running) {
        stop();
    } else {
        start();
    }
}

/**
 * Starts the beatTimer for playback
 */
function start() {
    if (!beatTimer.running) {
        beatTimer.start();
        beat = 0;
    }
}

/**
 * Stops the beatTimer for playback
 */
function stop() {
    beatTimer.stop();
    clearBeatIndicator();
}

/**
 * Plays the input buffer
 * @param {Instrument} buffer - The instrument to play
 */
function playSound(instrument) {
    var sample = audioContext.createBufferSource();
    sample.buffer = instrument.buffer;
    sample.connect(instrument.gain);
    sample.start(0);
}

/**
 * Plays the instruments that are set to play during the current beat and increments the beat
 */
function onBeat() {
    onBeatChange();
    for (var i = 0; i < instruments.length; ++i) {
        if (instruments[i].sequence[beat] > 0) {
            playSound(instruments[i]);
        }
    }
    for (var i = 0; i < instruments.length; ++i) {
        instruments[i].updateBuffer();
    }

    beat = (beat + 1) % 16;
}