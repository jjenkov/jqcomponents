
function jqcList() {
    var list = { viewModel : null };

    var labelField = "name";

    list.labelField = function(fieldName) {
        if(typeof fieldName == "undefined") { return labelField; }
        labelField = fieldName;
        return list;
    }

    list.configure = function() {
        console.log("   configuring jqcList");
        list.viewModel = list.jqc.pageController.factories.jqcViewModel();
        list.viewModel.component = list;

        return list;
    }

    list.render = function() {
        console.log("   rendering jqcList");
        if(list.viewModel == null) return;

        var html = "";
        for(var i=0; i < list.viewModel.viewModelObjects.length; i++) {
            html += "<li>" + list.viewModel.viewModelObjects[i].dataObject[labelField] + "</li>";
        }

        list.jqc.element.html(html);

        list.viewModel.clean();
        return list;
    }

    return list;
}
