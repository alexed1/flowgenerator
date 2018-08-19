({
    doInit: function (component) {
        var currentUrl = window.location.href;
        //for example
        //https://myinstance-dev-ed.lightning.force.com/one/one.app#/n/namespace__ComponentName
        var splitedUrl = currentUrl.split('/');
        var lastPart = splitedUrl.pop();

        var prefixSeparatorIndex = lastPart.lastIndexOf('__');
        var organizationPrefix = '';

        if (prefixSeparatorIndex > 0) {
            organizationPrefix = lastPart.substr(0, prefixSeparatorIndex) + '__';
        }

        var url = '/apex/' + organizationPrefix + 'sessionIdRetrievalVFPage?parentUrl=' + currentUrl;
        component.set('v.callerURL', url);
        var listenerFunction = function (event) {
            //xss vulnerability?
            var sessionId = event.data.sessionId;
            if (sessionId) {
                component.set('v.showVFPage', false);
                component.set('v.sessionId', sessionId);
                window.removeEventListener("message", listenerFunction);
            }
        };
        window.addEventListener("message", listenerFunction, true);
    },

    getMetadataItemListAsync: function (cmp, event, helper) {
        var args = event.getParam('arguments');
        var type = args.type;
        var onSuccess = null;
        var onError = null;
        var result = new Promise(function (resolve, reject) { 
            onSuccess = resolve;
            onError = reject;
        });
        helper.ensureSessionIdIsRetrievedAsync(cmp)
            .then(function (sessionId) { return helper.loadMetadataItemListAsync(cmp, sessionId, type); } )
            .then(onSuccess)
            .catch(onError);
        return result;
    },

    getMetadataItemAsync: function (cmp, event, helper) {var args = event.getParam('arguments');
        var type = args.type;
        var name = args.name;
        var onSuccess = null;
        var onError = null;
        var result = new Promise(function (resolve, reject) { 
            onSuccess = resolve;
            onError = reject;
        });
        helper.ensureSessionIdIsRetrievedAsync(cmp)
            .then(function (sessionId) { return helper.loadMetadataItemAsync(cmp, sessionId, type, name); })
            .then(onSuccess)
            .catch(onError);
        return result;
    }
})