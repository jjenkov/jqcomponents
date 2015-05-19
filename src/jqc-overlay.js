
function jqcOverlay() {
    var overlay = {};

    overlay.show = function() {
        overlay.jqc.element.show();
    }

    overlay.hide = function() {
        overlay.jqc.element.hide();
    }

    overlay.toggle = function() {
        overlay.jqc.element.toggle();
    }

    return overlay;
}
