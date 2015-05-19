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


