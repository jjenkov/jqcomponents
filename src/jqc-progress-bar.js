
function jqcProgressBar() {
    var progressBar = {  };

    var progressDiv = null;
    var maxVal      = 100;
    var val         = 0;
    var width       = 0;

    progressBar.configure = function() {
        progressDiv = progressBar.jqc.element.find("div");
        progressDiv.html("&nbsp;");
        return progressBar;
    }

    progressBar.maxValue = function(maxValue){
        if(typeof maxValue === "undefined"){
            return maxValue;
        }
        maxVal = maxValue;
        calculateAndSetWidth();
        return progressBar;
    };

    progressBar.value = function(theValue) {
        if(typeof theValue === "undefined"){
            return val;
        }
        if(theValue <= maxVal){
            val = theValue;
        } else {
            val = maxVal;
        }
        calculateAndSetWidth();
        return progressBar;
    }



    function calculateAndSetWidth() {
        if(val < maxVal){
            var ratio = val / maxVal;
            width = ratio * progressBar.jqc.element.width();
        } else {
            console.log("   progress bar set to full width of parent: ");
            width = progressBar.jqc.element.width();
        }

        progressDiv.css("width", width);
    }

    return progressBar;
}
