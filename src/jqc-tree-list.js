
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
}