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