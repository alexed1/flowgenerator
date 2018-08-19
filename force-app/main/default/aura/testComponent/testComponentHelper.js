({
    showError: function (error) {
        var toast = $A.get('e.force:showToast');
        // For lightning1 show the toast
        if (toast) {
            //fire the toast event in Salesforce1
            toast.setParams({
                title: 'Error',
                message: error,
                type: 'error',
                timeout: 2000,
                mode: error.includes('Unknown type:') ? 'dismissible' : 'sticky'
            });
            toast.fire();
        }
    }
})
