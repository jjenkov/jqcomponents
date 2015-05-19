
function jqcButton() {

    var button = { config : {} };

    var eventManager = null;

    button.configure = function() {

        eventManager = jqcEventManager();
        var element = button.jqc.element;
        var pageController = button.jqc.pageController;

        eventManager.fireEventOn(element, "click");
        eventManager.fireEventOn(element, "mousedown");
        eventManager.fireEventOn(element, "mouseup");
        eventManager.fireEventOn(element, "mouseenter");
        eventManager.fireEventOn(element, "mouseleave");
        eventManager.fireEventOn(element, "mousemove");

        eventManager.addListenerFromElementAttribute(element, "jqc-click"     , pageController);
        eventManager.addListenerFromElementAttribute(element, "jqc-mouseup"   , pageController);
        eventManager.addListenerFromElementAttribute(element, "jqc-mousedown" , pageController);
        eventManager.addListenerFromElementAttribute(element, "jqc-mouseenter", pageController);
        eventManager.addListenerFromElementAttribute(element, "jqc-mouseleave", pageController);
    }


    button.click      = function(listener) { eventManager.addListener("click", listener); return button; };
    button.mouseenter = function(listener) { eventManager.addListener("mouseenter", listener); return button; };
    button.mouseleave = function(listener) { eventManager.addListener("mouseleave", listener); return button; };
    button.mousedown  = function(listener) { eventManager.addListener("mousedown", listener);  return button; };
    button.mouseup    = function(listener) { eventManager.addListener("mouseup", listener);    return button; };
    button.mousemove  = function(listener) { eventManager.addListener("mousemove", listener);  return button; };

    return button;
}
