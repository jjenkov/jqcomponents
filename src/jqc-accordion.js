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