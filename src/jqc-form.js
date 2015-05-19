
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

