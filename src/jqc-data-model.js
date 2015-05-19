
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
