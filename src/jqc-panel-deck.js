
function jqcPanelDeck() {
    panelDeck = { };

    var visiblePanel   = null;
    var visiblePanelId = null;
    var panelList      = new Array();


    panelDeck.configure = function() {
        var panelToShowAtStartup = panelDeck.jqc.element.attr("jqc-show");
        var panels               = panelDeck.jqc.element.find("[jqc-panel-id]");

        panelList.slice(0, panelList.length); //clear out panel list array - in case configure() is called more than once.
        panels.each(function() {
            var panel = jQuery(this);
            panelList.push(panel);
            var panelId = panel.attr("jqc-panel-id");
            if(panelToShowAtStartup != panelId) {
                panel.hide();
            } else {
                visiblePanel   = panel;
                visiblePanelId = panelId;
            }
        });

        return panelDeck;
    }

    panelDeck.show = function(panelId) {
        if(panelId == visiblePanel.attr("jqc-panel-id")) return;

        var panelToHide = visiblePanel;
        var panelToShow = panelDeck.jqc.element.find("[jqc-panel-id=" + panelId + "]");

        visiblePanel   = panelToShow;
        visiblePanelId = panelToShow.attr("jqc-panel-id");
        panelToShow.css("position", "static");
        panelToShow.fadeIn();

        panelToHide.css("position", "absolute");
        panelToHide.css("top"    , panelDeck.jqc.element.position().top  + 1);
        panelToHide.css("left"   , panelDeck.jqc.element.position().left + 1);
        panelToHide.css("width"  , panelDeck.jqc.element.width());
        panelToHide.fadeOut();

        return panelDeck;
    }


    panelDeck.showNext = function() {
        console.log("   panelDeck.showNext() called");
        var panelIndex = -1;
        for(var i=0; i < panelList.length; i++) {
            console.log ("   " + visiblePanelId + " == " + panelList[i].attr("jqc-panel-id"));
            if(visiblePanelId == panelList[i].attr("jqc-panel-id")) {
                panelIndex = i;
            }
        }
        if(panelIndex > -1){
            var nextPanelIndex = (panelIndex + 1) % panelList.length;
            var nextPanelId    = panelList[nextPanelIndex].attr("jqc-panel-id");
            console.log("   showing panel with index " + nextPanelIndex + " and panelId " + nextPanelId );

            panelDeck.show(nextPanelId);
        } else {
            console.log("   panel index: " + panelIndex);
        }

        return panelDeck;
    }

    return panelDeck;
}
