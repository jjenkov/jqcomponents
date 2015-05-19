/* a view model is not an independent component because it is used internally by data bound components */

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
