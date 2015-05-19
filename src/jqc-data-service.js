
function jqcDataService() {
    var dataService = { };

    var url      = null;
    var dataType = "JSON";
    var type     = "POST";
    var eventManager = null;



    dataService.configure = function() {
        eventManager = jqcEventManager();

        var element = dataService.jqc.element;
        var pageController = dataService.jqc.pageController;

        eventManager.addListenerFromElementAttribute(element, "jqc-done"   , pageController);
        eventManager.addListenerFromElementAttribute(element, "jqc-fail"   , pageController);
        eventManager.addListenerFromElementAttribute(element, "jqc-always" , pageController);

        var urlAttr = element.attr("jqc-url");
        if(typeof urlAttr != "undefined") {
            dataService.url(urlAttr);
        }
    }

    dataService.url = function(theUrl) {
        if(typeof theUrl == "undefined") { return url; }
        url = theUrl;
        return dataService;
    }

    dataService.dataType = function(theDataType)  {
        if(typeof theDataType == "undefined") { return dataType; }
        dataType = theDataType;
        return dataService;
    }

    dataService.type = function(theType) {
        if(typeof theType == "undefined") { return type; }
        type = theType;
        return dataService;
    }

    dataService.sendRequest = function(requestObject, carryThrough) {
        if(requestObject == null) { requestObject = {}; }

        jQuery.ajax( {
            url : url,
            data : requestObject,
            dataType : dataType,
            type     : type
        }).done(function(data, textStatus, jqxhr) {
                eventManager.fireEvent("done", function(doneListener) {
                    doneListener.listenerFunction(data, requestObject, carryThrough, textStatus, jqxhr);
                });
        }).fail(function(jqxhr, textStatus, errorThrown) {
                eventManager.fireEvent("fail", function(failListener) {
                    failListener.listenerFunction(requestObject, carryThrough, textStatus, errorThrown, jqxhr);
                });
        }).always(function(dataOrJqxhr, textStatus, errorThrownOrJqxhr){
                eventManager.fireEvent("always", function(alwaysListener) {
                    alwaysListener.listenerFunction(dataOrJqxhr, requestObject, carryThrough, textStatus, errorThrownOrJqxhr);
                });
            });
        ;

        return dataService;
    }

    dataService.done = function(listener) {
        eventManager.addListener("done", listener);
        return dataService;
    };
    dataService.fail = function(listener) {
        eventManager.addListener("fail", listener);
        return dataService;
    };
    dataService.always = function(listener) {
        eventManager.addListener("always", listener);
        return dataService;
    };

    return dataService;
}
