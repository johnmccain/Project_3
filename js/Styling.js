//The DOM Element objects of each led, indexed by beat
var leds = Array();

for(var i = 0; i < 16; ++i)
{
  var myId = 'id' + (i + 1);
  leds[i] = document.getElementById(myId);
}

/**
 * Toggles the color of the beat button pressed and calls changeBeat
 * @param {int} beat - the beat of the button that was pressed (from 0-15)
 */
function onBeatClick(beat)
{
  leds[beat].classList.toggle("ledOn");
  leds[beat].classList.toggle("ledOff");
  changeBeat(beat);
}

/**
 *  Updates the Leds to reflect the current state of the selected instrument's sequence
 */
function updateLeds()
{
  for(var i = 0; i < 16; ++i)
  {
    if(currentInstrument.sequence[i] > 0)
    {
      //led should be on
      leds[i].classList.remove("ledOff");
      leds[i].classList.add("ledOn");
    }
    else
    {
      //led should be off
      leds[i].classList.remove("ledOn");
      leds[i].classList.add("ledOff");
    }
  }
}