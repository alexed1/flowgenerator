public with sharing class MetadataServiceController {

	public static Integer API_VERSION = 43;

	@AuraEnabled
	public static MetadataResult getMetadataItems(String sessionId, String type) {
		MetadataResult result = new MetadataResult();
		result.done = true;
		try{
			MetadataService.MetadataPort service = createClient(sessionId);
			List<MetadataService.ListMetadataQuery> queries = new List<MetadataService.ListMetadataQuery>();
			MetadataService.ListMetadataQuery queryWorkflow = new MetadataService.ListMetadataQuery();
			queryWorkflow.type_x = type;
			queries.add(queryWorkflow);
			MetadataService.FileProperties[] fileProperties = service.listMetadata(queries, API_VERSION);
			if (fileProperties != null) {
				for(MetadataService.FileProperties fileProperty : fileProperties)
				{
					result.results.add(fileProperty.fullName);
				}
				result.results.sort();
			}
		}
		catch (Exception ex) {
			result.success = false;
			result.error = ex.getMessage();
		}
		return result;
	}

	@AuraEnabled
	public static MetadataResult beginRetrieveMetadata(String sessionId, String type, String name) {
		String jobId = MetadataServiceController.retrievePackage(sessionId, type, name);
		MetadataResult result = new MetadataResult(jobId);
		return result;
	}	

	@AuraEnabled
	public static MetadataResult endRetrieveMetadata(String sessionId, String jobId){
		MetadataResult result = new MetadataResult(jobId);
		try {
			MetadataService.MetadataPort service = createClient(sessionId);
			MetadataService.RetrieveResult retrieveResult = service.checkRetrieveStatus(jobId, true);
			if(retrieveResult.done)
			{
				result.done = true;
				if (retrieveResult.success)
				{
					result.result = extractMetatadatResultFromZipArchive(retrieveResult.zipFile);
					if (result.result == null) {
						result.success = false;
						result.error = 'Retrieved metadata archive doesn\'t contain any items';
					}
				}
				else
				{
					result.success = false;
					result.error = retrieveResult.errorMessage;
				}
			}
		}
		catch (Exception ex) {
			result.success = false;
			result.error = ex.getMessage();
		}
		return result;
	}

	@AuraEnabled
	public static MetadataResult beginUpsertMetadata(String sessionId, String type, String name, String content) {
		MetadataResult result = new MetadataResult();
		try {
			Zippex archive = new Zippex();
			String packageXML = generatePackageXml(type, name);
			Blob packageXMLBlob = Blob.valueOf(packageXML);
			archive.addFile('package.xml', packageXMLBlob, null);
			Blob contentBlob = Blob.valueOf(content);
			archive.addFile(type + '/' + name + '.' + type, contentBlob, null);
			Blob zipData = archive.getZipArchive();
			String base64EncodedArchive = EncodingUtil.base64Encode(zipData);
			String jobId = deployPackage(sessionId, base64EncodedArchive);
			result.jobId = jobId;
		}
		catch(Exception ex) {
			result.success = false;
			result.error = ex.getMessage();
		}
		return result;
	}

	@AuraEnabled
	public static MetadataResult endUpsertMetadata(String sessionId, String jobId){
		MetadataResult result = new MetadataResult(jobId);
		try {
			MetadataService.MetadataPort service = createClient(sessionId);
			MetadataService.DeployResult deployResult = service.checkDeployStatus(jobId, true);
			if (deployResult.done)
			{
				result.done = true;
				if(deployResult.details.componentFailures != null)
				{
					List<String> errors = new List<String>();
					for(MetadataService.DeployMessage deployMessage : deployResult.details.componentFailures)
						if(deployMessage.problem != null)
							errors.add(deployMessage.problem);
					if (errors.size() > 0) {
						result.success = false;
						result.error = String.join(errors, ', ');
					}
				} 
				if (deployResult.details.retrieveResult != null && deployResult.details.retrieveResult.done)
				{
					if (deployResult.details.retrieveResult.zipFile != null)
					{
						result.success = true;
						result.result = extractMetatadatResultFromZipArchive(deployResult.details.retrieveResult.zipFile);
						if (result.result == null) {
							result.success = false;
							result.error = 'Retrieved metadata archive doesn\'t contain any items';
						}
					}
					else {
						result.success = false;
						String errorMessage = 'Failed to retrieve metadata because the archive with metadata doesn\'t exist';
						result.error = String.isBlank(result.error) ? errorMessage : (result.error + ', ' + errorMessage);
					}
				}
			}
		}
		catch (Exception ex) {
			result.success = false;
			result.error = ex.getMessage();
		}
		return result;
	}

	private static String extractMetatadatResultFromZipArchive(String base64Archive){
		Zippex archive = new Zippex(EncodingUtil.base64Decode(base64Archive));
		Set<String> fileNames = archive.getFileNames();
		for (String fileName : fileNames)
		{
			if (fileName.endsWith('meta.xml') || fileName == 'package.xml') {
				continue;
			}
			Blob file = archive.getFile(fileName);
			return file.toString();
		}
		return null;
	}

	private static String generatePackageXml(String type, String name){
		return
				'<?xml version="1.0" encoding="UTF-8"?>'+
				'<Package xmlns="http://soap.sforce.com/2006/04/metadata">'+
				'    <types>'+
				'        <name>' + type.escapeXml() + '</name>' +
				'        <members>' + name.escapeXml() + '</members>' +
				'    </types>'+
				'    <version>'+ API_VERSION + '.0</version>'+
				'</Package>';
	}

	private static MetadataService.MetadataPort createClient(String sessionId){
		MetadataService.MetadataPort service = new MetadataService.MetadataPort();
		service.SessionHeader = new MetadataService.SessionHeader_element();
		service.SessionHeader.sessionId = sessionId;
		return service;
	}

	private static String deployPackage(String sessionId, String base64EncodedArchive){
		MetadataService.MetadataPort service = createClient(sessionId);
		MetadataService.DeployOptions deployOptions = new MetadataService.DeployOptions();
		deployOptions.allowMissingFiles = false;
		deployOptions.autoUpdatePackage = false;
		deployOptions.checkOnly = false;
		deployOptions.ignoreWarnings = false;
		deployOptions.performRetrieve = true;
		deployOptions.purgeOnDelete = false;
		deployOptions.rollbackOnError = false;
		deployOptions.singlePackage = true;
		deployOptions.testLevel = 'NoTestRun';
		MetadataService.AsyncResult AsyncResult = service.deploy(base64EncodedArchive, DeployOptions);
		return AsyncResult.Id;
	}

	private static String retrievePackage(String sessionId, String type, String name){
		MetadataService.MetadataPort service = createClient(sessionId);
		MetadataService.RetrieveRequest request = new MetadataService.RetrieveRequest();
		request.apiVersion = API_VERSION;
		request.singlePackage = true;

		MetadataService.Package_x manifest = new MetadataService.Package_x();
		manifest.types = new List<MetadataService.PackageTypeMembers>();
		manifest.types.Add(new MetadataService.PackageTypeMembers());
		manifest.types[0].name = type;
		manifest.types[0].members = new List<String>();
		manifest.types[0].members.add(name);
		request.unpackaged = manifest;
		return service.retrieve(request).id;
	}
}
