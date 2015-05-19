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