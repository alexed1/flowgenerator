({  
    ensureSessionIdIsRetrievedAsync: function (cmp) {
        var self = this;
        var result = new Promise(function (resolve) {
            var sessionId = cmp.get('v.sessionId');
            if (sessionId) {
                resolve(sessionId);
            } else {
                window.setTimeout($A.getCallback(function () {
                    self.ensureSessionIdIsRetrievedAsync(cmp).then(function (success) { 
                        resolve(success);
                    })
                }), 250);
            }
        });
        return result;
    },    

    loadMetadataItemListAsync: function (cmp, sessionId, type) {
        var result = new Promise(function (resolve, reject) {
            var callback = $A.getCallback(function () {
                var action = cmp.get('c.getMetadataItems');
                action.setParams({
                    sessionId: sessionId,
                    type: type
                });
                action.setCallback(this, function (response) {
                    var callback = $A.getCallback(function () {
                        var state = response.getState();
                        if (state === 'SUCCESS') {
                            var result = response.getReturnValue();
                            if (result.success) {
                                resolve(result.results);
                            } else {
                                reject(result.error);
                            }
                        } else {
                            reject(response.getError());
                        }
                    });
                    callback();
    
                });
                $A.enqueueAction(action);
            });
            callback();
        });
        return result;        
    },          

    _beginLoadMetadataItemAsync: function (cmp, sessionId, type, name) {
        var result = new Promise(function (resolve, reject) {
            var callback = $A.getCallback(function () {
                var action = cmp.get('c.beginRetrieveMetadata');
                action.setParams({
                    sessionId: sessionId,
                    type: type,
                    name: name
                });
                action.setCallback(this, function (response) {
                    var callback = $A.getCallback(function () {
                        var state = response.getState();
                        if (state === 'SUCCESS') {
                            var result = response.getReturnValue();
                            if (result.success) {
                                resolve(result.jobId);
                            } else {
                                reject(result.error);
                            }
                        } else {
                            reject(response.getError());
                        }
                    });
                    callback();
    
                });
                $A.enqueueAction(action);
            });
            callback();
        });
        return result;        
    },

    _endLoadMetadataItemAsync: function (cmp, sessionId, jobId) {
        var result = new Promise(function (resolve, reject) {
            var callback = $A.getCallback(function () {
                var action = cmp.get('c.endRetrieveMetadata');
                action.setParams({
                    sessionId: sessionId,
                    jobId: jobId
                });
                action.setCallback(this, function (response) {
                    var callback = $A.getCallback(function () {
                        var state = response.getState();
                        if (state === 'SUCCESS') {
                            var result = response.getReturnValue();
                            if (result.success) {
                                resolve(result);
                            } else {
                                reject(result.error);
                            }
                        } else {
                            reject(response.getError());
                        }
                    });
                    callback();
    
                });
                $A.enqueueAction(action);
            });
            callback();
        });
        return result;
    },

    _waitForMetadataLoadAsync: function (cmp, sessionId, jobId, totalWaitTime, onSuccess, onError) {
        const waitTimeIncrement = 250; //0.25 second
        const defaultWaitTime = 30000; //30 seconds
        if (totalWaitTime > defaultWaitTime) {
            onError('The metadata item loading timeout has exceeded ' + defaultWaitTime + ' msec');
            return;
        }
        var self = this;
        this._endLoadMetadataItemAsync(cmp, sessionId, jobId)
            .then(function (metadataResult) {
                if (metadataResult.success) {
                    if (metadataResult.done) {
                        onSuccess(metadataResult.result);
                    } else {
                        window.setTimeout(function () {
                            self._waitForMetadataLoadAsync(cmp, sessionId, jobId, totalWaitTime + waitTimeIncrement, onSuccess, onError);
                        }, waitTimeIncrement);                        
                    }
                }
            })
            .catch(onError);
    },

    loadMetadataItemAsync: function (cmp, sessionId, type, name) {
        var self = this;
        var onSuccess = null;
        var onError = null;
        var result = new Promise(function (resolve, reject) {
            onSuccess = resolve;
            onError = reject;
        });
        self._beginLoadMetadataItemAsync(cmp, sessionId, type, name)
            .then(function (jobId) { return self._waitForMetadataLoadAsync(cmp, sessionId, jobId, 0, onSuccess, onError); });
        return result;
    }
})