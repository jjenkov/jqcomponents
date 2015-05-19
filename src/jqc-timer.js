/* Remember to improve minification in this component */
function jqcTimer() {
    var timer = { timeIntervalMillis : -1, started : false };

    timer.start = function() {
        console.log("   timer starting");
        timer.started = true;
        timer.aroundTick(false);
    }

    timer.stop = function() {
        timer.started = false;
    }

    /* called internally - handles time out + start / stop signal etc. */
    timer.aroundTick = function(executeOnTick) {
        if(timer.started && timer.timeIntervalMillis > 0 ) {
            console.log("   setting timeout to:  " + timer.timeIntervalMillis);
            setTimeout( function() { timer.aroundTick(true); }, timer.timeIntervalMillis );
        }
        if(executeOnTick) {
            timer.tick();
        }
    }

    timer.tick = function() {
        console.log ("   tick...");
    }

    return timer;
}
