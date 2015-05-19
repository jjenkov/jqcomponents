/* For internal use in components - both built-in and custom components. Could theoretically be used in modules too. */
function jqcEventManager() {
    var manager = { };

    var listeners = {};
    var idCounter = 0;

    manager.addListener = function(eventType, listener) {
        var listenerObj = { id: idCounter++, listenerFunction : listener };
        listenerObj.remove = function() {
            manager.removeListener(listenerObj);
        };

        if(typeof listeners[eventType] == "undefined") {
            listeners[eventType] = [];
        }
        listeners[eventType].push(listenerObj);
        return listenerObj;
    }

    manager.addListenerFromElementAttribute = function(element, eventAttrName, pageController)  {
        var jqcClickFuncExpr      = element.attr(eventAttrName);
        if(typeof jqcClickFuncExpr !== "undefined"){
            var eventType = eventAttrName.substring(4, eventAttrName.length); //remove 'jqc-' from attr. name.
            var clickListenerFunction = pageController.lookupFunction(jqcClickFuncExpr); //todo remove reference to global object jqc.pageController ?
            return manager.addListener(eventType, clickListenerFunction);
        }
        return null;
    }

    manager.removeListener = function(listenerObj) {
        for(var eventType in listeners) {
            var listenerArray = listeners[eventType];

            for(var i=0; i < listenerArray.length; i++) {
                if(listenerArray[i].id == listenerObj.id) {
                    listenerArray.splice(i,1);
                    return;
                }
            }
        }
    }

    manager.fireEvent = function(eventType, func) {
        var listenerArray = listeners[eventType];
        if(typeof listenerArray == "undefined") {
            return;
        }
        for(var i=0; i < listenerArray.length; i++) {
            func(listenerArray[i]);
        }
    }


    manager.fireEventOn = function(element, eventType){

        element.on(eventType, function(event) {
            manager.fireEvent(eventType, function(listenerObj) { listenerObj.listenerFunction(event); });
        });

    }

    return manager;

}