({
    init : function(component, event, helper) {
        var metacmp = component.find("metalib");
        var flowstring = metacmp.getMetadataItemListAsync("flow");
        console.log("flowstring is" + flowstring);

    }
})
