
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
}