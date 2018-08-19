public class MetadataResult {
    @AuraEnabled
    public String jobId;
    //Returns true if metadata operation is completed
    @AuraEnabled
    public Boolean done;
    //Returns true if metadata operation is completed AND was successful
    @AuraEnabled
    public Boolean success;

    @AuraEnabled
    public String result;

    @AuraEnabled
    public List<String> results;

    @AuraEnabled
    public String error;

    public MetadataResult() {
        success = true;
        results = new List<String>();
    }

    public MetadataResult(String jobId) {
        this.jobId = jobId;
        success = true;
        results = new List<String>();
    }
}