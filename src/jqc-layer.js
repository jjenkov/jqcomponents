
function jqcLayer() {
    var layer = {};

    layer.show = function() {
        layer.jqc.element.fadeIn();
        return layer;
    }

    layer.hide = function() {
        layer.jqc.element.fadeOut();
        return layer;
    }


    layer.position = function(x, y) {
        layer.jqc.element.css("left", x);
        layer.jqc.element.css("top" , y);
        return layer;
    }


    /* Note: This function may change in the future */
    layer.alignWith = function(align, elementId, offsets) {
        var alignWithElement = jQuery(elementId);
        var pos              = alignWithElement.position();
        if(offsets == null) {
            offsets = { top: 0, left: 0 };
        }

        offsets.alignWithElementHeight = alignWithElement.height()
            + layer.calculateValueWithoutPx(alignWithElement.css("padding-top"))
            + layer.calculateValueWithoutPx(alignWithElement.css("padding-bottom"))
            + layer.calculateValueWithoutPx(alignWithElement.css("border-top-width"))
            + layer.calculateValueWithoutPx(alignWithElement.css("border-bottom-width"))
        ;
        offsets.alignWithElementWidth = alignWithElement.width()
            + layer.calculateValueWithoutPx(alignWithElement.css("padding-left"))
            + layer.calculateValueWithoutPx(alignWithElement.css("padding-right"))
            + layer.calculateValueWithoutPx(alignWithElement.css("border-left-width"))
            + layer.calculateValueWithoutPx(alignWithElement.css("border-right-width"))
        ;
        offsets.layerHeight = layer.jqc.element.height()
            + layer.calculateValueWithoutPx(layer.jqc.element.css("padding-top"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("padding-bottom"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("border-top-width"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("border-bottom-width"))
        ;
        offsets.layerWidth = layer.jqc.element.width()
            + layer.calculateValueWithoutPx(layer.jqc.element.css("padding-left"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("padding-right"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("border-left-width"))
            + layer.calculateValueWithoutPx(layer.jqc.element.css("border-right-width"))
        ;

        if("leftTop" == align) {
            layer.position(pos.left + offsets.left - offsets.layerWidth, pos.top  + offsets.top);
        } else if("leftBottom" == align) {
            layer.position(pos.left + offsets.left - offsets.layerWidth, pos.top  + offsets.alignWithElementHeight - offsets.layerHeight + offsets.top);
        } else if("rightTop" == align) {
            layer.position(pos.left + offsets.left + offsets.alignWithElementWidth, pos.top  + offsets.top);
        } else if("rightBottom" == align) {
            layer.position(pos.left + offsets.left + offsets.alignWithElementWidth, pos.top  + offsets.alignWithElementHeight - offsets.layerHeight + offsets.top);
        } else if ("topLeft"  == align) {
            layer.position(pos.left + offsets.left, pos.top  - offsets.layerHeight + offsets.top);
        } else if ("topRight"    == align) {
            layer.position(pos.left + offsets.left + alignWithElement.width(), pos.top  - offsets.layerHeight + offsets.top);
        } else if ("bottomLeft"  == align) {
            layer.position(pos.left + offsets.left, pos.top  + offsets.alignWithElementHeight + offsets.top);
        } else if ("bottomRight"    == align) {
            layer.position(pos.left + offsets.left + alignWithElement.width(), pos.top  + offsets.alignWithElementHeight  + offsets.top);
        }

        return layer;
    }

    layer.calculateValueWithoutPx = function(valueString) {
        if(valueString.indexOf("px") != -1) {
            valueString = valueString.substring(0, valueString.length - 2);
        }
        return parseInt(valueString, 10);
    }

    return layer;
}
