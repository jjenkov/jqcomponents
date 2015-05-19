
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

