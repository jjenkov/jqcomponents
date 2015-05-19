/*
 * This document-ready listener creates a jqcPageController and boots it.
 * The jqcPageController then scans the page for components and modules, and instantiate and boot them.
 * Once the jqcPageController finishes its boot procedure, it becomes a passive container for the components
 * and modules. Only components and modules are active after that.
 * */

jqc = {}; //global jqc object contains all jqc related stuff

jQuery(document).ready(function() {
    if(typeof jqcAutoBoot === "undefined" || jqcAutoBoot === true){
        console.log("== jqc: Auto Boot Begin");
        jqc.pageController = jqcPageController();
        jqc.pageController.boot();
        console.log("== jqc: Auto Boot Done");
    } else {
        console.log("== jqc: No Auto Boot");
    }
});



function jqcPageController() {

    var pageController = {};

    var bootPhases = [ "configure" , "layout", "render"]; /* phases after registration and instantiation */
    var bootState  = {instantiateModules : false, register : false, instantiateComponents: false, configure: false, layout: false, render: false };
    var moduleList = new Array(); // this is not visible outside Page Controller.
    var componentList = new Array();

    pageController.factories  = {};     /* contains instantiation factories for all component types */
    pageController.modules    = {};     /* contains all modules with an id. */
    pageController.components = {};     /* contains all components with an id. */


    pageController.instantiateModules = function() {
        console.log("== jqc: instantiateModules phase started ==");
        var modules = jQuery("[jqc-module]");
        var _jqcPageController = pageController;
        modules.each(function() {
            var moduleElement = jQuery(this);
            var moduleFactoryFunctionName = moduleElement.attr("jqc-module");
            var moduleId                  = moduleElement.attr("id");
            if(typeof moduleId === "undefined") {
                moduleId = moduleFactoryFunctionName;
            }

            try{
                var module = eval(moduleFactoryFunctionName +"()");
                _jqcPageController.addModule(moduleId, module);
            } catch(e) {
                console.log("Error instantiating module: " + moduleId + ", exception: " + e);
            }
        });
    }

    pageController.addModule = function(moduleId, moduleObject) {
        moduleObject.jqc = { pageController : pageController, id : moduleId };

        moduleList.push(moduleObject);
        if(moduleId != null){
            pageController.modules[moduleId] = moduleObject;
        }

        console.log("   added module: " + moduleId);
    }

    pageController.register =  function() {
        console.log("== jqc: register phase started ==");
        bootState.register = true;

        /* layout components */
        addFactory("jqcResponsiveLayoutGrid"   ,  function() { return jqcResponsiveLayoutGrid(); } ) ;
        addFactory("jqcResponsiveLayoutManager",  function() { return jqcResponsiveLayoutManager(); } ) ;

        /* visual components */
        addFactory("jqcEmpty"      ,  function() { return jqcEmpty();  });
        addFactory("jqcLabel"      ,  function() { return jqcLabel();  });
        addFactory("jqcPanelDeck"  ,  function() { return jqcPanelDeck();  });
        addFactory("jqcLayer"      ,  function() { return jqcLayer();  });
        addFactory("jqcOverlay"    ,  function() { return jqcOverlay();  });
        addFactory("jqcProgressBar",  function() { return jqcProgressBar();  });
        addFactory("jqcAccordion"    ,  function() { return jqcAccordion();  });
        //addFactory("jqcToolbar"    ,  function() { return jqcToolbar();  });
        //addFactory("jqcNavBar"     ,  function() { return jqcNavBar();  });
        //addFactory("jqcNavBar2"    ,  function() { return jqcNavBar2();  });

        /* data and data view components */
        addFactory("jqcDataService", function() { return jqcDataService(); });
        addFactory("jqcDataModel"  , function() { return jqcDataModel(); });
        addFactory("jqcViewModel"  , function() { return jqcViewModel(); });
        addFactory("jqcList"       , function() { return jqcList();      });
        addFactory("jqcTable"      , function() { return jqcTable();     });
        addFactory("jqcTreeList"   , function() { return jqcTreeList();  });

        /* action and navigation components */
        addFactory("jqcButton", function() { return jqcButton();    });

        /* form components */
        addFactory("jqcForm",   function() { return jqcForm();      });

        /* utility components */
        addFactory("jqcTimer",  function() { return jqcTimer();  });

        jQuery("[jqc-factory]").each(function(i, e){
            var element = jQuery(this);
            var factoryFunctionName = element.attr("jqc-factory");
            var factoryFunction = pageController.lookupFunction(factoryFunctionName);
            var factoryName     = element.attr("id");
            if(typeof factoryName === "undefined"){
                factoryName     = factoryFunctionName;
            }
            addFactory(factoryName, function() { return factoryFunction(); });
            console.log("   added factory " + factoryName);
        });

    }

    /*This function exists only to make calls to pageController.addFactory minify better */
    function addFactory(componentType, factoryFunction){
        pageController.addFactory(componentType, factoryFunction);
    }

    pageController.addFactory = function(componentType, factoryFunction) {
        pageController.factories[componentType] = factoryFunction;
    }

    pageController.instantiateComponents = function() {
        console.log("== jqc: instantiate phase started ==");
        bootState.instantiate = true;
        var _jqcPageController = pageController;

        var jqcComponents = jQuery("[jqc-type]");
        jqcComponents.each(function() {
            var compElement = jQuery(this);

            try {
                var factoryFunction = _jqcPageController.factories[compElement.attr("jqc-type")];
                var htmlElementId   = compElement.attr("id");
                if(typeof factoryFunction === "undefined"){
                    console.error("   jqc error: No factory function found for component (id = " + htmlElementId + ") with type: " + compElement.attr("jqc-type"));
                } else {
                    var comp          =  factoryFunction();
                    _jqcPageController.addComponent(htmlElementId, comp, compElement);
                }

            } catch (e) {
                console.error ("   jqc error: Instantiation of component (id = " + htmlElementId + ", type = " + compElement.attr("jqc-type") + ") failed. Exception: " + e);
            }
        });
    }

    pageController.addComponent = function(componentId, componentObject, componentElement) {
        componentObject.jqc = { pageController : pageController, id : componentId, element : componentElement };
        componentList.push(componentObject);
        if(componentId != null) {
            pageController.components[componentId] = componentObject;
        }
    }

    pageController.executeModulePhase = function(phaseName) {
        console.log("== jqc: " + phaseName + " phase started ==");
        bootState[phaseName] = true;

        for(var i=0; i < moduleList.length; i++) {
            var module = moduleList[i];
            if(typeof module[phaseName] === 'function' ) {
                module[phaseName](pageController); //pass pageController as parameter to phase function
            }
        }
    }

    pageController.executeComponentPhase = function(phaseName) {
        console.log("== jqc: " + phaseName + " phase started ==");
        bootState[phaseName] = true;

        for(var i=0; i < componentList.length; i++) {
            var comp = componentList[i];
            if(typeof comp[phaseName] === 'function' ) {
                comp[phaseName]();
            }
        }
    }


    pageController.boot = function() {
        if(!bootState.instantiateModules)   { pageController.instantiateModules();    }
        if(!bootState.register)             { pageController.register();              pageController.executeModulePhase("postRegister"); }
        if(!bootState.instantiateComponents){ pageController.instantiateComponents(); pageController.executeModulePhase("postInstantiate"); }

        for(var i=0; i < bootPhases.length; i++) {
            var bootPhase = bootPhases[i];
            if(!bootState[bootPhase]) {
                pageController.executeComponentPhase(bootPhase);
                pageController.executeModulePhase("post" + bootPhase.substring(0,1).toUpperCase() + bootPhase.substring(1, bootPhase.length));
            }
        }

        console.log("== jqc: Boot done ==");

    }


    /* A utility function used by components (or modules) to lookup a global function, a function in a module or function
       in a component, based on a function expression string ( e.g. "myModule.onCountryChange" ).
     */
    pageController.lookupFunction = function(functionExpression) {
        var dotIndex   = functionExpression.indexOf(".");
        var funcOwner  = dotIndex > -1 ? functionExpression.substring(0, dotIndex) : "";
        var funcName   = dotIndex > -1 ? functionExpression.substring(dotIndex + 1, functionExpression.length) : functionExpression;
        if(funcName.indexOf("()") == funcName.length -2){
            funcName = funcName.substring(0, funcName.length -2);
        }
        var func   = null;

        if(funcOwner !== "") {
            var module = pageController.modules[funcOwner];
            if(typeof module !== "undefined") {
                func   = module[funcName];       //function in module
                if(typeof func === "undefined") {
                    throw "No function named " + funcName + " found in module " + funcOwner;
                }
            } else {
                var component = pageController.components[funcOwner];
                if(typeof component !== "undefined") {
                    func = component[funcName];  //function in component
                    if(typeof func === "undefined") {
                        throw "No function named " + funcName + " found in component " + funcOwner;
                    }
                } else {
                   throw "No module or component found named " + funcOwner;
                }
            }
        } else {
            func   = eval(funcName);    //global function
        }

        if(typeof func !== "function") {
            throw "" + funcName + " is not a function.";
        }

        return func;
    }

    return pageController;
}


function jqcAccordion() {
    var acc = {};

    var headersById = {};
    var headers = new Array();
    var panels  = new Array();

    acc.configure = function() {


        var isHeader = true;
        var children = acc.jqc.element.children();
        children.each(function(i, e){
            var child = jQuery(this);

            if(isHeader){
                var thisHeader = { element        : child,
                    toggleExpand   : child.find("[jqc-accordion-toggle=expand]"),
                    toggleCollapse : child.find("[jqc-accordion-toggle=collapse]"),
                    expanded       : "true" == child.attr("jqc-expanded") ? true : false,
                    id             : child.attr("jqc-panel-id")
                };
                if(typeof thisHeader.id != "undefined"){
                    headersById[thisHeader.id] = thisHeader;
                }
                headers.push(thisHeader);
            } else {
                panels.push({ element : child });
            }

            isHeader  = !isHeader;
        });

        for(var i=0; i < headers.length; i++) {
            var header = headers[i];
            header.panel = panels[i];
            header.element.click(createClickHandler(headers[i]));
            if(header.expanded) {
                doExpand(header);
            } else {
                doCollapse(header);
            }
        }

    }

    acc.expand = function(panelId){
        doExpand(headersById[panelId]);
    }
    acc.collapse = function(panelId){
        doCollapse(headersById[panelId]);
    }
    acc.toggle = function(panelId){
        doToggle(headersById[panelId]);
    }

    function createClickHandler(header) {
        return function(e) { doToggle(header); }
    }

    function doToggle(header){
        header.expanded = !header.expanded;
        if(header.expanded){
            doExpand(header);
        } else {
            doCollapse(header);
        }
    }

    function doExpand(header){
        header.panel.element.show();
        header.toggleExpand.hide();
        header.toggleCollapse.show();
    }

    function doCollapse(header){
        header.panel.element.hide();
        header.toggleExpand.show();
        header.toggleCollapse.hide();
    }

    return acc;
}
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

function jqcDataModel() {

    var listenerId = 0;
    var dataModel  =  {  };

    var idField = "id";
    var data    = new Array();
    var eventManager = null;


    dataModel.idField = function(fieldName) {
        if(typeof fieldName === "undefined"){
            return idField;
        }
        idField =  fieldName;
    }

    dataModel.configure = function() {
        eventManager = jqcEventManager();
    }


    dataModel.setData = function(dataArray) {
        data = dataArray;
        eventManager.fireEvent("set-data", function(listener){
            listener.listenerFunction(dataArray);
        });
    }

    dataModel.addData = function(dataArray) {
        for(var i = 0; i < dataArray.length; i++) {
            data.push(dataArray[i]);
        }
        eventManager.fireEvent("add-data", function(listener){
            listener.listenerFunction(dataArray);
        });
    }

    dataModel.updateData = function(dataArray) {
        for(var i=0; i < data.length; i++) {
            for(var j=0; j < dataArray.length; j++) {
                //console.log(data[i][idField] + " == " + dataArray[j][idField]);
                if(data[i][idField] == dataArray[j][idField]) {
                    data[i] = dataArray[j];
                } else {
                }
            }
        }
        eventManager.fireEvent("update-data", function(listener){
            listener.listenerFunction(dataArray);
        });
    }

    dataModel.removeData = function(dataArray) {
        for(var i = 0; i < data.length; i++) {
            for(var j=0; j < dataArray.length; j++) {
                if(data[i][idField] == dataArray[j][idField] ){
                    data.splice(i,1);
                    i--; // i should go 1 index back to not skip next element, when an element was just removed.
                    break;
                }
            }
        }

        eventManager.fireEvent("remove-data", function(listener){
            listener.listenerFunction(dataArray);
        });

    }



    /* listener functions below */

    dataModel.addListener = function(listener) {
        //listener.jqcListenerId = listenerId++;
        //dataModel.listeners.push(listener);

        var listenerIds = {};

        listenerIds.setId = eventManager.addListener("set-data",    listener.setData);
        listenerIds.addId = eventManager.addListener("add-data",    listener.addData);
        listenerIds.updateId = eventManager.addListener("update-data", listener.updateData);
        listenerIds.removeId = eventManager.addListener("remove-data", listener.removeData);

        return listenerIds;
    }


    dataModel.removeListener = function(listenerIds) {
        eventManager.removeListener(listenerIds.setId);
        eventManager.removeListener(listenerIds.addId);
        eventManager.removeListener(listenerIds.updateId);
        eventManager.removeListener(listenerIds.removeId);

        return dataModel;
    }

    return dataModel;
}

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

function jqcEmpty() {
    return {};
}

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
function jqcForm() {

    var form = { };

    var objectBeingEdited = {};
    var suffix            = null;
    var validators        = {};
    var eventManager      = null;


    form.configure = function() {
        eventManager = jqcEventManager();

        var element        = form.jqc.element;
        var pageController = form.jqc.pageController;

        eventManager.addListenerFromElementAttribute(element, "jqc-post-get"   , pageController);
        eventManager.addListenerFromElementAttribute(element, "jqc-post-set"   , pageController);
        eventManager.addListenerFromElementAttribute(element, "jqc-post-reset" , pageController);

        var suffix = element.attr("jqc-suffix");
        if(typeof suffix !== "undefined"){
            form.suffix(suffix);
        }
    }

    form.postResetFieldValues = function(listener) {
        eventManager.addListener("post-reset", listener);
        return form;
    }

    form.postSetFieldValues = function(listener) {
        eventManager.addListener("post-set", listener);
        return form;
    }

    form.postGetFieldValues = function(listener) {
        eventManager.addListener("post-get", listener);
        return form;
    }

    form.suffix = function(theSuffix) {
        if(typeof theSuffix == "undefined"){
            return suffix;
        }
        suffix = theSuffix;
        return form;
    }

    form.validate = function() {
        var validationState =  {};

        for(validatorName in validators){
            var validator = validators[validatorName];

            if(typeof validator === "function") {
                validationState[validatorName] = validator(form, validatorName, validator);
            } else if(typeof validator.validatorFunction === "function"){
                validationState[validatorName] = validator.validatorFunction(form, validatorName, validator);
            }
        }

        validationState.isValid = function() {
            for(stateName in validationState) {
                if(stateName === "isValid")     { continue; }
                if(!validationState[stateName]) { return false; }
            }
            return true;
        }

        return validationState;
    }

    form.validators = function(theValidators) {
        validators = theValidators;
        return form;
    }

    form.editObject = function(theObject) {
        objectBeingEdited = theObject;
        form.setFieldValues(theObject);
        return form;
    }

    form.editedObject = function() {
        return form.getFieldValues(objectBeingEdited);
    }

    form.editedObjectCopy = function() {
        var copy = {};

        for(var field in objectBeingEdited){
            copy[field] = objectBeingEdited[field];
        }

        return form.getFieldValues(copy);
    }

    form.resetFieldValues = function() {
        objectBeingEdited = {};
        var inputFields = form.jqc.element.find("input,select,textarea");
        inputFields.each(function(i,e){
            var field = jQuery(this);

            var type = field.attr("type");
            if(type === "radio" ){
                field.prop("checked", false);
            } else if(type == "checkbox") {
                field.prop("checked", false);
            } else if(field.prop("tagName") == "SELECT"){
                var options = field.find("option");
                options.each(function() {
                    var option    = jQuery(this);
                    option.prop("selected", false);
                });
            } else {               //todo don't reset hidden form fields?
                field.val("");
            }
        });
        eventManager.fireEvent("post-reset", function(listener) {
            listener.listenerFunction(form);
        });

        return form;
    }


    form.setFieldValues = function(dataObject){

        var inputFields = form.jqc.element.find("input,select,textarea");
        inputFields.each(function(i,e){
            var field = jQuery(this);
            var id = field.attr("id");
            if(id == null){
                id = field.attr("name");
            }
            if(suffix != null && (id.indexOf(suffix) == id.length - suffix.length) ){
                id = id.substring(0, id.length - suffix.length);
            }

            var type = field.attr("type");
            if(type === "radio" ){
                field.prop("checked", dataObject[id] == field.val());
            } else if(type == "checkbox") {
                form.setCheckboxFieldValue(dataObject, field, id);
            } else if(field.prop("tagName") == "SELECT"){
                form.setSelectFieldValue(dataObject, field, id);
            } else {
                field.val(dataObject[id]);
            }
        });

        eventManager.fireEvent("post-set", function(listener) {
            listener.listenerFunction(form, dataObject);
        });

        return form;
    }

    form.getFieldValues = function(dataObject) {
        if(typeof dataObject == "undefined" || dataObject == null) {
            dataObject = {};
        }

        var inputFields = form.jqc.element.find("input,select,textarea");
        inputFields.each(function(i,e){
            var field = jQuery(this);
            var id = field.attr("id");
            if(id == null){
                id = field.attr("name");
            }
            if(suffix != null && (id.indexOf(suffix) == id.length - suffix.length) ){
                id = id.substring(0, id.length - suffix.length);
            }


            var type = field.attr("type");
            if(type === "radio" ){
                if(field.prop("checked")) dataObject[id] = field.val();
            } else if(type === "checkbox" ) {
                form.getCheckboxFieldValue(dataObject, field, id);
            } else if(field.prop("tagName") == "SELECT"){
                form.getSelectFieldValue(dataObject, field, id)
            } else {
                dataObject[id] = field.val();
            }
        });

        eventManager.fireEvent("post-get", function(listener) {
            listener.listenerFunction(form, dataObject);
        })


        return dataObject;
    }

    form.getCheckboxFieldValue = function(dataObject, field, id) {
        if(field.prop("checked")){
            dataObject[id] = (typeof dataObject[id] === "undefined") ? field.val() : dataObject[id] + "," + field.val();
        }
    }

    form.setCheckboxFieldValue = function(dataObject, field, id) {
        if(typeof dataObject[id] === "undefined") {
            return;
        }
        var val = field.val();
        if(val === dataObject[id]) {
            field.prop("checked", true);
        } else {
            var checked = false;
            var values = dataObject[id].split(",");
            for(var i=0; i<values.length; i++) {
                if(val == values[i]){
                    checked = false;       //todo should this not be "true" instead of "false"?
                }
            }
            field.prop("checked", checked);
        }
    }

    form.getSelectFieldValue = function(dataObject, field, id) {
        dataObject[id] = field.val();
    }

    form.setSelectFieldValue = function(dataObject, field, id) {
        if(typeof dataObject[id] === "undefined"){
            return;
        }
        var val     = dataObject[id];
        var values  = val.split(",");
        var options = field.find("option");

        options.each(function() {
            var option    = jQuery(this);
            var optionVal = option.val();
            if(optionVal == val){
                option.prop("selected", true);
            } else {
                var selected = false;
                for(var i=0; i < values.length; i++){
                    if(optionVal == values[i]){
                        selected = true;
                    }
                }
                option.prop("selected", selected);
            }

        })
    }

    return form;
}


function jqcLabel() {
    var label = {};

    /* deprecated from version 0.8.2 */
    label.setHtml = function(text) {
        label.jqc.element.html(text);
        console.warn("   jqcLabel.setHtml() has been deprecated since v. 0.8.2. Use jqcLabel.html() instead. ");
        return label;
    }

    label.html = function(htmlText) {
        label.jqc.element.html(htmlText);
        return label;
    }

    label.ok = function(htmlText) {
        label.html(htmlText);
        label.jqc.element
            .addClass("jqcLabelOk")
            .removeClass("jqcLabelInfo")
            .removeClass("jqcLabelWarning")
            .removeClass("jqcLabelError")
        ;
        return label;
    }

    label.info = function(htmlText) {
        label.html(htmlText);
        label.jqc.element
            .addClass("jqcLabelInfo")
            .removeClass("jqcLabelOk")
            .removeClass("jqcLabelWarning")
            .removeClass("jqcLabelError")
        ;
        return label;
    }

    label.warning = function(htmlText) {
        label.html(htmlText);
        label.jqc.element
            .addClass("jqcLabelWarning")
            .removeClass("jqcLabelOk")
            .removeClass("jqcLabelInfo")
            .removeClass("jqcLabelError")
        ;
        return label;
    }

    label.error = function(htmlText) {
        label.html(htmlText);
        label.jqc.element
            .addClass("jqcLabelError")
            .removeClass("jqcLabelOk")
            .removeClass("jqcLabelInfo")
            .removeClass("jqcLabelWarning")
        ;
        return label;
    }

    return label;
}


function jqcLayer() {
    var layer = {};

    layer.show = function() {
        layer.jqc.element.fadeIn();
        return layer;
    }

    layer.hide = function() {
        layer.jqc.element.fadeOut();
        return layer;
    }


    layer.position = function(x, y) {
        layer.jqc.element.css("left", x);
        layer.jqc.element.css("top" , y);
        return layer;
    }


    /* Note: This function may change in the future */
    layer.alignWith = function(align, elementId, offsets) {
        var alignWithElement = jQuery(elementId);
        var pos              = alignWithElement.position();
        if(offsets == null) {
            offsets = { top: 0, left: 0 };
        }

        offsets.alignWithElementHeight = alignWithElement.height()
            + layer.calculateValueWithoutPx(alignWithElement.css("padding-top"))
            + layer.calculateValueWithoutPx(alignWithElement.css("padding-bottom"))
            + layer.calculateValueWithoutPx(alignWithElement.css("border-top-width"))
            + layer.calculateValueWithoutPx(alignWithElement.css("border-bottom-width"))
        ;
        offsets.alignWithElementWidth = alignWithElement.width()
            + layer.calculateValueWithoutPx(alignWithElement.css("padding-left"))
            + layer.calculateValueWithoutPx(alignWithElement.css("padding-right"))
            + layer.calculateValueWithoutPx(alignWithElement.css("border-left-width"))
            + layer.calculateValueWithoutPx(alignWithElement.css("border-right-width"))
        ;
        offsets.layerHeight = layer.jqc.element.height()
            + layer.calculateValueWithoutPx(layer.jqc.element.css("padding-top"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("padding-bottom"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("border-top-width"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("border-bottom-width"))
        ;
        offsets.layerWidth = layer.jqc.element.width()
            + layer.calculateValueWithoutPx(layer.jqc.element.css("padding-left"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("padding-right"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("border-left-width"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("border-right-width"))
        ;

        if("leftTop" == align) {
            layer.position(pos.left + offsets.left - offsets.layerWidth, pos.top  + offsets.top);
        } else if("leftBottom" == align) {
            layer.position(pos.left + offsets.left - offsets.layerWidth, pos.top  + offsets.alignWithElementHeight - offsets.layerHeight + offsets.top);
        } else if("rightTop" == align) {
            layer.position(pos.left + offsets.left + offsets.alignWithElementWidth, pos.top  + offsets.top);
        } else if("rightBottom" == align) {
            layer.position(pos.left + offsets.left + offsets.alignWithElementWidth, pos.top  + offsets.alignWithElementHeight - offsets.layerHeight + offsets.top);
        } else if ("topLeft"  == align) {
            layer.position(pos.left + offsets.left, pos.top  - offsets.layerHeight + offsets.top);
        } else if ("topRight"    == align) {
            layer.position(pos.left + offsets.left + alignWithElement.width(), pos.top  - offsets.layerHeight + offsets.top);
        } else if ("bottomLeft"  == align) {
            layer.position(pos.left + offsets.left, pos.top  + offsets.alignWithElementHeight + offsets.top);
        } else if ("bottomRight"    == align) {
            layer.position(pos.left + offsets.left + alignWithElement.width(), pos.top  + offsets.alignWithElementHeight  + offsets.top);
        }

        return layer;
    }

    layer.calculateValueWithoutPx = function(valueString) {
        if(valueString.indexOf("px") != -1) {
            valueString = valueString.substring(0, valueString.length - 2);
        }
        return parseInt(valueString, 10);
    }

    return layer;
}

function jqcList() {
    var list = { viewModel : null };

    var labelField = "name";

    list.labelField = function(fieldName) {
        if(typeof fieldName == "undefined") { return labelField; }
        labelField = fieldName;
        return list;
    }

    list.configure = function() {
        console.log("   configuring jqcList");
        list.viewModel = list.jqc.pageController.factories.jqcViewModel();
        list.viewModel.component = list;

        return list;
    }

    list.render = function() {
        console.log("   rendering jqcList");
        if(list.viewModel == null) return;

        var html = "";
        for(var i=0; i < list.viewModel.viewModelObjects.length; i++) {
            html += "<li>" + list.viewModel.viewModelObjects[i].dataObject[labelField] + "</li>";
        }

        list.jqc.element.html(html);

        list.viewModel.clean();
        return list;
    }

    return list;
}

function jqcOverlay() {
    var overlay = {};

    overlay.show = function() {
        overlay.jqc.element.show();
    }

    overlay.hide = function() {
        overlay.jqc.element.hide();
    }

    overlay.toggle = function() {
        overlay.jqc.element.toggle();
    }

    return overlay;
}

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
function jqcResponsiveLayoutManager() {

    var manager = {};

    var widthIntervals   = [0, 300, 600, 900, 1200];
    var columnCount      = 12;
    var columnCounts     = ["12", "", "", "", ""];
    var rowWidths        = ["100%", "", "", "", "1200"];
    var rowPaddings      = ["0","","","",""];
    var cellSpacings     = ["0","","","",""];
    var rowSelector      = "div[jqc-row]";
    var cellAttr         = "jqc-cell";
    var cellSelector     = ">div[" + cellAttr +"]";
    var cellIndexAttr    = "jqc-cell-indexes";
    var columnCountAttr  = "jqc-column-count";
    var columnCountsAttr = "jqc-column-counts";
    var rowWidthsAttr    = "jqc-row-widths";
    var rowPaddingsAttr  = "jqc-row-paddings";
    var cellSpacingsAttr = "jqc-cell-spacings";
    var widthIntervalsAttr = "jqc-width-intervals";

    var managerWidth = 0;
    var managerWidthInterval = 0;

    var eventManager = jqcEventManager();

    var rows = new Array();

    manager.widthChange         = function(listener) { eventManager.addListener("width-change", listener); return manager; } ;
    manager.widthIntervalChange = function(listener) { eventManager.addListener("width-interval-change", listener); return manager; };


    manager.configure = function () {
        //todo create "var element = manager.jqc.element"  to shorten code
        console.log("   jqcResponsiveLayoutManager NEW configure() start");

        var managerWidthIntervalAttr = manager.jqc.element.attr(widthIntervalsAttr);
        if(typeof managerWidthIntervalAttr != "undefined") {
            parseWidthIntervals(managerWidthIntervalAttr, widthIntervals);
        }

        var managerColumnCountAttr = manager.jqc.element.attr(columnCountAttr);
        if(typeof managerColumnCountAttr != "undefined") {
            columnCount = parseInt(managerColumnCountAttr, 10);
        }

        //todo these 4 blocks of code are very similar. create a function to shorten code
        configureManagerFromAttribute(columnCountsAttr, columnCounts, widthIntervals.length);
        configureManagerFromAttribute(rowWidthsAttr, rowWidths, widthIntervals.length);
        configureManagerFromAttribute(rowPaddingsAttr, rowPaddings, widthIntervals.length);
        configureManagerFromAttribute(cellSpacingsAttr, cellSpacings, widthIntervals.length);

        rows.splice(0, rows.length);  /* remove previous row definitions */

        var rowElements = jQuery(rowSelector);
        //console.log("rows: " + rowElements.size());
        rowElements.each(function() {
            configureRow(jQuery(this));
        });

        var pageController = manager.jqc.pageController;
        var element = manager.jqc.element;
        eventManager.addListenerFromElementAttribute(element, "jqc-width-change"   , pageController);
        eventManager.addListenerFromElementAttribute(element, "jqc-width-interval-change"   , pageController);


        jQuery(window).resize(function() { manager.layout(); });



        console.log("   jqcResponsiveLayoutManager configure() end");
    }

    function configureManagerFromAttribute (attrName, targetArray, targetArrayLength) {
        var attrValue = manager.jqc.element.attr(attrName);
        if(typeof attrValue != "undefined") {
            parseWidthDefs(attrValue, targetArray, targetArrayLength);
        }
    }

    function parseWidthIntervals(managerWidthIntervalAttr, widthIntervals) {
        widthIntervals.splice(0, widthIntervals.length);  /* remove previous width intervals */
        var widthIntervalStrings = managerWidthIntervalAttr.split(",");
        for(var j=0; j<widthIntervalStrings.length; j++) {
            widthIntervals.push(parseInt(widthIntervalStrings[j].trim(), 10));
        }
    }



    function configureRow (rowElement) {
        var row = { element: rowElement, widthIntervals : [], columnCounts : [],
                   width: 0, innerWidth: 0, widths : [], paddings : [], cellSpacings: [],
                   columnCount : columnCount,
                   cells : [],
                   sortCells : false,
                   columnBoundaries: [] };

        removeWhiteSpaceBetweenCells(row);

        //todo refer to manager.config arrays instead of copying them?
        var rowWidthIntervalsAttr = row.element.attr(widthIntervalsAttr);
        if(typeof rowWidthIntervalsAttr != "undefined"){
            parseWidthIntervals(rowWidthIntervalsAttr, row.widthIntervals);
        } else {
            copyArray(widthIntervals, row.widthIntervals);
        }

        //todo remove this code, as column count attr will be deprecated in the future (use columnCounts attribute instead).
        var rowColumnCountAttr = row.element.attr(columnCountAttr);
        if(typeof rowColumnCountAttr != "undefined") {
            row.columnCount = parseInt(rowColumnCountAttr, 10);
        }

        configureRowFromAttribute(row, columnCountsAttr, row.columnCounts, row.widthIntervals.length, columnCounts);
        configureRowFromAttribute(row, rowWidthsAttr   , row.widths      , row.widthIntervals.length, rowWidths);
        configureRowFromAttribute(row, rowPaddingsAttr , row.paddings    , row.widthIntervals.length, rowPaddings);
        configureRowFromAttribute(row, cellSpacingsAttr, row.cellSpacings, row.widthIntervals.length, cellSpacings);

        configureCells(row);

        rows.push(row);
        //console.log("       c: row.widths: " + row.widths);

    }


    // todo - better name for this function (configureRowArray()??).
    // it parses a string of values related to width intervals (eg. 0:12 4:8 8:4)
    function configureRowFromAttribute (row, attrName, targetArray, targetArrayLength, defaultSourceArray) {
        var attrValue = row.element.attr(attrName);
        if(typeof attrValue != "undefined"){
            parseWidthDefs(attrValue, targetArray, row.widthIntervals.length);
        } else {
            copyArray(defaultSourceArray, targetArray);
        }
    }



    function removeWhiteSpaceBetweenCells(row){
        row.element.contents().filter(
            function() { return (this.nodeType == 3 && !/\S/.test(this.nodeValue)); }
        ).remove();
    }


    function copyArray (from, to) {
        for(var i= 0; i < from.length; i++){
            to[i] = from[i];
        }
    }

    function configureCells (row) {
        var cells = row.element.find(cellSelector);

        //console.log("cells: " + cells.size());
        cells.each(function(i, e) {
            configureCell(row, jQuery(this), row.cells);
            row.cells[i].naturalIndex = i;
        });
    }

    function configureCell (row, cellElement, cells) {
        var cell = { element: cellElement, width: 0, widths : [], naturalIndex : 0, indexForInterval : -1,  indexes : [] };

        var widthDef = cellElement.attr(cellAttr);
        parseWidthDefs(widthDef, cell.widths, row.widthIntervals.length);

        var indexDef = cellElement.attr(cellIndexAttr);
        cell.indexes.slice(0, cell.indexes.length);
        if(typeof indexDef != "undefined"){
            //manager.parseIndexDefs(indexDef, cell.indexes, row.widthIntervals.length);
            parseWidthDefs(indexDef, cell.indexes, row.widthIntervals.length);
            row.sortCells = true;
        } else {
            for(var j=0; j < row.widthIntervals.length; j++) {
                cell.indexes.push("");
            }
        }

        cells.push(cell);
    }


    /* parses width interval based definitions like cell column widths, cell indexes etc ("0:4  4:2"  etc). */
    function parseWidthDefs (widthDef, widths, widthIntervalCount) {
        resetWidthDefs(widths, widthIntervalCount);
        var widthDefs = widthDef.split(" ");
        for(var j=0; j < widthDefs.length; j++){
            var colonIndex = widthDefs[j].indexOf(":");
            var intervalIndex = parseInt( widthDefs[j].substring(0, colonIndex ), 10  );
            widths[intervalIndex] = widthDefs[j].substring( colonIndex + 1 );
        }
    }


    function resetWidthDefs (widths, widthIntervalCount) {
        for(var i=0; i < widthIntervalCount; i++ ) {
            widths[i] = "";
        }
    }

    manager.layout = function() {
        //console.log("   jqcResponsiveLayoutManager layout() start");

        var prevWidth = managerWidth;
        managerWidth = jQuery(window).innerWidth();

        var prevWidthInterval = managerWidthInterval;
        managerWidthInterval = determineWidthInterval(managerWidth, widthIntervals);

        //determine row width for all rows
        for(var i=0; i < rows.length; i++ ) {
            var row = rows[i];

            //find row level width interval
            var rowParentElementWidth = row.element.parent().innerWidth();
            row.widthInterval = determineWidthInterval(rowParentElementWidth, row.widthIntervals);

            var widthDefForInterval = findWidthDefForInterval(row.widths, row.widthInterval, "100%");
            row.width               = parsePercentageOrFixedWidthDef(widthDefForInterval, rowParentElementWidth);
            if(row.width > 0) {
                row.element.css("width", row.width).show();
            } else {
                row.element.hide(); /* hide to prevent content from overflowing */
            }

            var rowPaddingDefForInterval = findWidthDefForInterval(row.paddings, row.widthInterval, "0");
            var rowPaddingForInterval    = parsePercentageOrFixedWidthDef(rowPaddingDefForInterval, row.width);

            var cellSpacingDefForInterval = findWidthDefForInterval(row.cellSpacings, row.widthInterval, "0");
            var cellSpacingForInterval    = parsePercentageOrFixedWidthDef(cellSpacingDefForInterval, row.width);

            row.columnCount = parseInt(findWidthDefForInterval(row.columnCounts, row.widthInterval, "12"), 10);

            calcRowColumnBoundaries(row, rowPaddingForInterval, cellSpacingForInterval);

            var cellArray = row.cells;
            if(row.sortCells){
                cellArray = sortCells(row);
            }

            manager.layoutCells(row, cellArray, rowPaddingForInterval, cellSpacingForInterval);
        }

        eventManager.fireEvent("width-change", function(listener) {
            listener.listenerFunction(managerWidth, prevWidth);
        });
        if(managerWidthInterval != prevWidthInterval) {
            eventManager.fireEvent("width-interval-change", function(listener) {
                listener.listenerFunction(managerWidthInterval, prevWidthInterval);
            });
        }

        //console.log("   jqcResponsiveLayoutManager layout() end");
    }

    manager.layoutCells = function(row, cellArray, rowPaddingForInterval, cellSpacingForInterval) {
        var columnIndex = 0;
        for(var j=0; j < cellArray.length; j++) {
            var cell = cellArray[j];

            cell.columnIndex = columnIndex;
            var cellWidthDefForInterval = findWidthDefForInterval(cell.widths, row.widthInterval, "0");
            cell.width = parseColumnWidthDef(cellWidthDefForInterval, row, cell);
            if(cell.width > 0) {
                cell.element.css("width", cell.width);
                if(cell.columnIndex == 0){
                    cell.element.css("margin-left", rowPaddingForInterval);
                } else {
                    cell.element.css("margin-left", cellSpacingForInterval);
                }
                cell.element.show();
            } else {
                cell.element.hide(); // cells with width 0 must be hidden to prevent content from flowing out of them.
            }

            columnIndex += cell.columnWidth;
            if(columnIndex >= row.columnCount ) {
                columnIndex = 0;  //todo in case of nested cells, reset to parent cell index, not 0.
            }
        }

    }

    // returns a copy of the cell array, sorted according to current window width interval
    function sortCells(row) {
        //determine cell indexes for cell sorting
        for(var j=0; j < row.cells.length; j++) {
            var cell = row.cells[j];
            var indexDefForInterval = findWidthDefForInterval(cell.indexes, row.widthInterval, "");
            cell.indexForInterval = indexDefForInterval == "" ?  -1 : parseInt(indexDefForInterval, 10);
        }

        //sort cell array
        var cellsCopy = new Array(row.cells.length);
        for(var j=0; j<row.cells.length; j++){
            var cell = row.cells[j];
            if(cell.indexForInterval != -1){
                cellsCopy[cell.indexForInterval] = cell;
            }
        }
        for(var j=0; j<row.cells.length; j++){
            var cell = row.cells[j];
            if(cell.indexForInterval == -1){
                var tempOffset = 0;
                while( cellsCopy[cell.naturalIndex + tempOffset] != null ) {
                    tempOffset++;
                }
                cellsCopy[cell.naturalIndex + tempOffset] = cell;
            }
        }

        //sort cell elements
        for(var j=0; j<cellsCopy.length; j++) {
            cellsCopy[j].element.appendTo(row.element);
        }
        return cellsCopy;
    }

    function parseColumnWidthDef (def, row, cell) {
        var unit = def.substring(def.length-1, def.length);
        if(unit == "c"){
            var columnWidth = def.substring(0, def.length -1);

            cell.columnWidth = parseInt(columnWidth, 10);
            return row.columnBoundaries[cell.columnIndex + cell.columnWidth].prevColEnd -
                row.columnBoundaries[cell.columnIndex].nextColBegin;
        }
    }

    /* searches through an array of width interval based definitions, and finds the definition nearest to the current width interval */
    function findWidthDefForInterval (widths, widthInterval, defaultValue) {
        var index = widthInterval;
        while(widths[index] == "" && index >= 0){
            index--;
        }
        if(index >= 0) return widths[index];
        return defaultValue;
    }


    function parsePercentageOrFixedWidthDef (def, parentWidth) {
        var unit = def.substring(def.length-1, def.length);

        if(unit == "%"){
            var widthAsPercentage = def.substring(0, def.length -1);
            return Math.floor( parentWidth * parseFloat(widthAsPercentage) / 100 );
        } else {
            return parseInt(def, 10);
        }
    }

    function calcRowColumnBoundaries (row, rowPadding, cellSpacing) {
        row.innerWidth = row.width - (rowPadding * 2) + cellSpacing; /* + columnSpacing because leftmost and rightmost cells each have a 1/2 cell spacing calculated, but never added as left/right margin, so virtual grid width should be 1 spacing bigger than reality */

        row.columnBoundaries  = new Array(row.columnCount + 1); /* make an extra space for the final boundary - total width of column grid.*/

        for(var i=0; i < row.columnCount; i++){
            var calculatedBoundary = Math.floor(row.innerWidth * i / row.columnCount);
            var prevColEnd   = calculatedBoundary - Math.floor(cellSpacing / 2);
            var nextColBegin = calculatedBoundary + Math.floor(cellSpacing / 2);
            row.columnBoundaries[i] = { prevColEnd: prevColEnd, boundary: calculatedBoundary, nextColBegin : nextColBegin };
        }

        row.columnBoundaries[row.columnCount] = {
            prevColEnd: row.innerWidth - Math.floor(cellSpacing / 2),
            boundary  : row.innerWidth
        };
    }

    function determineWidthInterval (width, widthIntervals) {
        for(var i=0; i<widthIntervals.length; i++) {
            if(width < widthIntervals[i]) return i-1;
        }
        return widthIntervals.length-1;
    }

    return manager;
}
function jqcTable() {
    var table = { viewModel : null };

    var columns = [];
    var dataKey = "jqcTableViewModelObject";
    var eventManager = null;


    table.columns = function(columnsArray) {
        if(typeof columnsArray == "undefined")  return columns;

        columns = columnsArray;
        return table;
    }

    table.configure = function() {
        console.log("   configuring jqcTable");
        var element = table.jqc.element;
        var pageController = table.jqc.pageController;

        table.viewModel = pageController.factories.jqcViewModel();
        table.viewModel.component = table;

        eventManager = jqcEventManager();

        eventManager.addListenerFromElementAttribute(element, "jqc-click-row"     , pageController);
        eventManager.addListenerFromElementAttribute(element, "jqc-dblclick-row"  , pageController);


        return table;
    }

    table.render = function() {
        console.log("   rendering jqcTable");
        if(table.viewModel == null) return;
        table.jqc.element.empty();

        var header = "<tr>";
        for(var i=0; i<columns.length; i++) {
            header += "<th>" + columns[i].label + "</th>"
        }
        header += "</tr>";

        var headerElement = jQuery(header);
        headerElement.appendTo(table.jqc.element);

        for(var i=0; i < table.viewModel.viewModelObjects.length; i++) {
            var viewModelObject = table.viewModel.viewModelObjects[i];
            if(viewModelObject.isRemoved())                     { continue; }
            if(!table.viewModel.filterAccepts(viewModelObject)) { continue; }

            var rowElement = jQuery("<tr></tr>");

            if(viewModelObject.selected){
                rowElement.addClass("jqcTableRowSelected");
            }
            /* generate HTML for cells in row */
            for(var j=0; j < columns.length; j++) {
                var columnField = columns[j].field;
                if(typeof columns[j].renderer != "undefined" && columns[j].renderer != null) {
                    var tableCell = jQuery("<td></td>");
                    columns[j].renderer(columnField, viewModelObject, tableCell);
                    tableCell.appendTo(rowElement);
                } else {
                    rowElement.append("<td>" + viewModelObject.dataObject[columns[j].field] + "</td>");
                }
            }

            viewModelObject.element = rowElement;
            rowElement.data( dataKey, viewModelObject );

            /* add event listeners to row */
            rowElement.click   (function(event) {
                var clickedRowElement = jQuery(this);
                var clickedViewModelObject = clickedRowElement.data(dataKey);
                if(typeof clickedViewModelObject.selected === 'undefined' || clickedViewModelObject.selected === false) {
                    if(!event.ctrlKey){
                        table.unselectAllRows();
                    }
                    table.selectRow(clickedViewModelObject);
                } else {
                    table.unselectRow(clickedViewModelObject);
                }
                eventManager.fireEvent("click-row", function(listener) {
                    listener.listenerFunction(event, clickedRowElement, clickedViewModelObject);
                });
            });
            rowElement.dblclick(function(event) {
                var clickedRowElement = jQuery(this);
                var clickedViewModelObject = clickedRowElement.data(dataKey);
                clickedRowElement.addClass("jqcTableRowSelected");
                clickedViewModelObject.selected = true;

                eventManager.fireEvent("dblclick-row", function(listener) {
                    listener.listenerFunction(event, clickedRowElement, clickedViewModelObject);
                })
            } );

            rowElement.appendTo(table.jqc.element);
        }
        table.viewModel.clean();

        return table;
    }

    table.selectRow = function(viewModelObject) {
        viewModelObject.selected = true;
        viewModelObject.element.addClass("jqcTableRowSelected");
    }

    table.unselectRow = function(viewModelObject) {
        viewModelObject.selected = false;
        viewModelObject.element.removeClass("jqcTableRowSelected");
    }

    table.unselectAllRows = function() {
        for(var j=0; j < table.viewModel.viewModelObjects.length; j++) {
            table.unselectRow(table.viewModel.viewModelObjects[j]);
        }

    }

    table.selectedRows = function() {
        var rows = [];

        for(var i=0; i < table.viewModel.viewModelObjects.length; i++) {
            if(table.viewModel.viewModelObjects[i].selected) {
                rows.push(table.viewModel.viewModelObjects[i]);
            }
        }

        return rows;
    }

    /* event listener parameters: event, rowElement, viewModelObject  */

    table.clickRow = function(listenerFunction) {
        eventManager.addListener("click-row", listenerFunction);
        return table;
    }

    table.dblclickRow = function(listenerFunction) {
        eventManager.addListener("dblclick-row", listenerFunction);
        return table;
    }



    return table;
}/* Remember to improve minification in this component */
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
/* Remember to improve minification in this component */
function jqcToolbar() {
    var toolbar = {};

    toolbar.clickItem = function(itemId, clickListener) {
        toolbar.jqc.element.find(itemId).click(clickListener);
    }

    toolbar.hideItem = function(itemId)  {
        toolbar.jqc.element.find(itemId).hide();
        toolbar.applyItemStyles();
    }

    toolbar.showItem = function(itemId) {
        toolbar.jqc.element.find(itemId).show();
        toolbar.applyItemStyles();
    }

    toolbar.applyItemStyles = function(){
        var visibleItemIndex = 0;
        toolbar.jqc.element.children().each(function(element, index) {
            var toolbarItem = jQuery(this);
            var itemVisible = toolbarItem.css("display") != "none";
            if(itemVisible) {
                toolbarItem.addClass("jqcToolbarItem");
                if(visibleItemIndex == 0) {
                    toolbarItem.addClass("jqcToolbarItemFirst");
                } else {
                    toolbarItem.removeClass("jqcToolbarItemFirst");
                }
                visibleItemIndex++;
            }
        });
    }

    toolbar.configure = function() {
        toolbar.jqc.element.contents().each(function() {
            if(this.nodeType === 3 && this.nodeValue.trim() == "") {
                jQuery(this).detach();
            }
        })

        toolbar.applyItemStyles();
    }

    return toolbar;
}
function jqcTreeList() {
    var treeList = { viewModel : null };

    var labelField = "name";
    var eventManager = null;


    treeList.labelField = function(fieldName) {
        if(typeof fieldName == "undefined") { return labelField; }
        labelField = fieldName;
        return treeList;
    }

    treeList.configure = function() {
        console.log("   configuring jqcTreeList");
        treeList.viewModel = treeList.jqc.pageController.factories.jqcViewModel();
        treeList.viewModel.component = treeList;

        eventManager = jqcEventManager();
        var element = treeList.jqc.element;
        var pageController = treeList.jqc.pageController;
        eventManager.addListenerFromElementAttribute(element, "jqc-click-item"     , pageController);
        //eventManager.addListenerFromElementAttribute(element, "jqc-dblclick-item"  , pageController);

        return treeList;
    }

    treeList.render = function() {
        console.log("   rendering jqcTreeList");
        if(treeList.viewModel == null) return;

        treeList.jqc.element.empty();

        for(var i=0; i < treeList.viewModel.viewModelObjects.length; i++) {
            if(treeList.viewModel.viewModelObjects[i].modelStatus != "removed"){
                var listItem = createListItem(treeList.viewModel.viewModelObjects[i]);
            }
        }
        hideExpandHandlesForEmptyNodes();

        treeList.viewModel.clean();
        return treeList;
    }


    /* This is NOT a public function. It is called from inside render() */

     function createListItem(viewModelObject) {
        if(typeof viewModelObject.expanded == "undefined"){
            viewModelObject.expanded = false;
        }

        var listItem = jQuery("<li></li>");
        viewModelObject.element = listItem;
        listItem.addClass("jqcTreeListItemCollapsed");

        var listItemExpandHandle   = jQuery("<div class='jqcTreeListItemExpandHandle'>+</div>");
        var listItemCollapseHandle = jQuery("<div class='jqcTreeListItemCollapseHandle'>&ndash;</div>");
        var listItemEmptyHandle    = jQuery("<div class='jqcTreeListItemEmptyHandle'> </div>");

        viewModelObject.expandHandle   = listItemExpandHandle;
        viewModelObject.collapseHandle = listItemCollapseHandle;
        viewModelObject.emptyHandle    = listItemEmptyHandle;


        listItemExpandHandle.click(function() {
            viewModelObject.expanded = true;
            listItemExpandHandle.hide();
            listItemCollapseHandle.show();
            listItem.find(">ul").show();
        });

        listItemCollapseHandle.click(function() {
            viewModelObject.expanded = false;
            listItemExpandHandle.show();
            listItemCollapseHandle.hide();
            listItem.find(">ul").hide();
        });


        listItem.append(listItemExpandHandle);
        listItem.append(listItemCollapseHandle);
        listItem.append(listItemEmptyHandle);

        var listItemText = jQuery("<span></span>");
        listItemText.text(viewModelObject.dataObject[labelField]);
        listItem.append(listItemText);
        listItemText.click(function() {
            if(typeof viewModelObject.selected === 'undefined' || viewModelObject.selected === false) {
                if(!event.ctrlKey){
                    treeList.unselectAllItems();
                }
                treeList.selectItem(viewModelObject);
            } else {
                treeList.unselectItem(viewModelObject);
            }

            eventManager.fireEvent("click-item", function(listener) {
                listener.listenerFunction(event, listItem, viewModelObject);
            })
        });

        var childList = jQuery("<ul></ul>");
        listItem.append(childList);
        childList.hide();

        if(treeList.viewModel.parentIdField() != null) {
            var parentId = viewModelObject.dataObject[treeList.viewModel.parentIdField()];
            if(parentId != null) {

                // 1. find parent view model object
                var parentViewModelObject = treeList.viewModel.getViewModelObjectById(parentId);

                // 2. find parent element, and then its <ul> element.
                var parentChildList = parentViewModelObject.element.find(">ul");

                //3. add this list item to the parent element ul list.
                parentChildList.append(listItem);
            } else {
                treeList.jqc.element.append(listItem);
            }

        }
    }

    function hideExpandHandlesForEmptyNodes () {
        for(var i=0; i < treeList.viewModel.viewModelObjects.length; i++) {
            var viewModelObject = treeList.viewModel.viewModelObjects[i];
            var childList = viewModelObject.element.find(">ul");
            if(childList.children().size() == 0) {
                viewModelObject.expandHandle.hide();
                viewModelObject.collapseHandle.hide();
                viewModelObject.emptyHandle.show();
            } else {
                if(viewModelObject.expanded){
                    viewModelObject.expandHandle.hide();
                    viewModelObject.collapseHandle.show();
                    viewModelObject.emptyHandle.hide();
                    childList.show();
                } else {
                    viewModelObject.expandHandle.show();
                    viewModelObject.collapseHandle.hide();
                    viewModelObject.emptyHandle.hide();
                }
            }
        }
    }


    /* These ARE public functions again */
    treeList.selectItem = function(viewModelObject) {
        viewModelObject.selected = true;
        viewModelObject.element.addClass("jqcTreeListItemSelected");
    }

    treeList.unselectItem = function(viewModelObject) {
        viewModelObject.selected = false;
        viewModelObject.element.removeClass("jqcTreeListItemSelected");
    }

    treeList.unselectAllItems = function() {
        for(var j=0; j < treeList.viewModel.viewModelObjects.length; j++) {
            treeList.unselectItem(treeList.viewModel.viewModelObjects[j]);
        }
    }

    treeList.selectedItems = function() {
        var items = [];

        for(var i=0; i < treeList.viewModel.viewModelObjects.length; i++) {
            if(treeList.viewModel.viewModelObjects[i].selected) {
                items.push(treeList.viewModel.viewModelObjects[i]);
            }
        }

        return items;
    }

    treeList.clickItem = function(listenerFunction) {
        eventManager.addListener("click-item", listenerFunction);
        return treeList;
    }

    return treeList;
}/* a view model is not an independent component because it is used internally by data bound components */

function jqcViewModel() {

    var viewModel = {
         component        : null        /* the view component that uses this view model - set by the component that creates the view model  */
        ,viewModelObjects : new Array()

        /* childrenFieldName - for automatic generation of view model objects for child objects - in tree models? */
    };

    var idField = "id";
    var parentIdField = null;
    var sortFunction  = null;
    var filterFunction = null;


    viewModel.setData = function(dataArray) {
        viewModel.viewModelObjects.splice(0, viewModel.viewModelObjects.length);
        createViewModelObjects(dataArray);
        viewModel.sortData();
        viewModel.component.render();
    }


    /* todo create view model functions corresponding to addData(), updateData() and removeData() */
    viewModel.addData = function(dataArray) {
        for(var i=0; i < dataArray.length; i++){
            var viewModelObject = viewModel.createViewModelObject(dataArray[i]);
            viewModel.viewModelObjects.push(viewModelObject);
        }

        viewModel.sortData();
        viewModel.component.render();
    }

    viewModel.updateData = function(dataArray) {
        for(var i=0; i < dataArray.length; i++) {

            var updatedObject = dataArray[i];
            for(var j = 0; j < viewModel.viewModelObjects.length; j++){
                var viewModelObject = viewModel.viewModelObjects[j];
                if(updatedObject[idField] == viewModelObject.dataObject[idField]){
                    viewModelObject.dataObject = updatedObject;
                    viewModelObject.modelStatus = "updated";
                }
            }
        }
        viewModel.sortData();
        viewModel.component.render();

    }

    viewModel.removeData = function(dataArray) {
        for(var i=0; i < dataArray.length; i++) {

            var removedObject = dataArray[i];
            for(var j=0; j < viewModel.viewModelObjects.length; j++) {
                var viewModelObject = viewModel.viewModelObjects[j];
                if(removedObject[idField] == viewModelObject.dataObject[idField]) {
                    viewModelObject.modelStatus = "removed";
                    break; //a match was found - go on to next element in dataArray
                }
            }
        }
        viewModel.sortData();
        viewModel.component.render();

    }

    /* called by a view component after rendering the view model */
    viewModel.clean = function() {
        for(var i = 0; i < viewModel.viewModelObjects.length; i++){
            if(viewModel.viewModelObjects[i].isRemoved()) {
                viewModel.viewModelObjects.splice(i,1);
                i--;
            } else {
                viewModel.viewModelObjects[i].modelStatus = "clean";
            }
        }

    }



    function createViewModelObjects (dataArray) {
        for(var i=0; i < dataArray.length; i++){
            var viewModelObject = createViewModelObject(dataArray[i]);
            viewModel.viewModelObjects.push(viewModelObject);
        }
    }

    function createViewModelObject (dataObj) {
        var viewModelObject = { dataObject : dataObj, element : null, modelStatus : "added"};

        viewModelObject.isAdded   = function() { return viewModelObject.modelStatus === "added"};
        viewModelObject.isUpdated = function() { return viewModelObject.modelStatus === "updated"};
        viewModelObject.isRemoved = function() { return viewModelObject.modelStatus === "removed"};
        viewModelObject.isClean   = function() { return viewModelObject.modelStatus === "clean"};

        return viewModelObject;
    }

    viewModel.sortData = function() {
        if(sortFunction != null) {
            viewModel.viewModelObjects.sort(sortFunction);
        }
    }

    /* called by GUI component owning ViewModel - when determining if viewModelObject should be displayed or not */
    viewModel.filterAccepts = function(viewModelObject) {
        if(filterFunction == null) { return true; }

        return filterFunction(viewModelObject);
    }


    viewModel.idField = function(fieldName) {
        if(typeof fieldName == "undefined") {
            return idField;
        }
        idField = fieldName;
        return viewModel;
    }


    viewModel.parentIdField = function(fieldName) {
        if(typeof fieldName == "undefined") {
            return parentIdField;
        }
        parentIdField = fieldName;
        return viewModel;
    }


    viewModel.sortFunction = function(theSortFunction) {
        if(typeof theSortFunction == "undefined") {
            return sortFunction;
        }
        sortFunction = theSortFunction;
        return viewModel;
    }


    viewModel.filterFunction = function(theFilterFunction) {
        if(typeof theFilterFunction == "undefined") {
            return filterFunction;
        }
        filterFunction = theFilterFunction;
        return viewModel;
    }


    viewModel.getViewModelObjectById = function(dataObjectId) {
        for(var i=0; i < viewModel.viewModelObjects.length; i++){
            if(dataObjectId == viewModel.viewModelObjects[i].dataObject[idField]) {
                return viewModel.viewModelObjects[i];
            }
        }
        return null;
    }


    return viewModel;
}
