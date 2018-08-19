({
    onInit: function (cmp) {
        var metadataTypeList = 
`-None-
AccountSettings
ActionLinkGroupTemplate
ActionOverride
ActivitiesSettings
AddressSettings
AnalyticSnapshot
ApexClass
ApexComponent
ApexPage
ApexTrigger
AppMenu
ApprovalProcess
ArticleType
AssignmentRules
AuthProvider
AuraDefinitionBundle
AutoResponseRules
BaseSharingRule
Bot
BotVersion
BrandingSet
BusinessHoursSettings
BusinessProcess
CallCenter
CaseSettings
CaseSubjectParticle
Certificate
ChatterAnswersSettings
ChatterExtension
CleanDataService
CMSConnectSource
CompanySettings
Community (Zone)
CommunityTemplateDefinition
CommunityThemeDefinition
CompactLayout
ConnectedApp
ContentAsset
ContractSettings
CorsWhitelistOrigin
CriteriaBasedSharingRule
CustomApplication
CustomApplicationComponent
CustomFeedFilter
CustomField
CustomLabel
Custom Metadata Types (CustomObject)
CustomMetadata
CustomLabels
CustomObject
CustomObjectTranslation
CustomPageWebLink
CustomPermission
CustomSite
CustomTab
Dashboard
DataCategoryGroup
DelegateGroup
Document
DuplicateRule
EclairGeoData
EmailServicesFunction
EmailTemplate
EmbeddedServiceBranding
EmbeddedServiceConfig
EmbeddedServiceLiveAgent
EntitlementProcess
EntitlementSettings
EntitlementTemplate
EventDelivery
EventSubscription
ExternalServiceRegistration
ExternalDataSource
FeatureParameterBoolean
FeatureParameterDate
FeatureParameterInteger
FieldSet
FileUploadAndDownloadSecuritySettings
FlexiPage
Flow
FlowDefinition
Folder
FolderShare
ForecastingSettings
GlobalValueSet
GlobalValueSetTranslation
GlobalPicklistValue
Group
HomePageComponent
HomePageLayout
IdeasSettings
Index
InstalledPackage
KeywordList
KnowledgeSettings
Layout
Letterhead
LightningComponentBundle
ListView
LiveAgentSettings
LiveChatAgentConfig
LiveChatButton
LiveChatDeployment
LiveChatSensitiveDataRule
ManagedTopics
MatchingRule
Metadata
MetadataWithContent
MilestoneType
MlDomain (Beta)
MobileSettings
ModerationRule
NamedCredential
NamedFilter
NameSettings
Network
NetworkBranding
OpportunitySettings
OrderSettings
OrgPreferenceSettings
OwnerSharingRule
Package
PathAssistant
PathAssistantSettings
PermissionSet
PersonalJourneySettings
Picklist (Including Dependent Picklist)
PlatformCachePartition
Portal
PostTemplate
ProductSettings
Profile
ProfileActionOverride
ProfilePasswordPolicy
ProfileSessionSetting
Queue
QuickAction
QuoteSettings
RecordType
RemoteSiteSetting
Report
ReportType
Role
SamlSsoConfig
Scontrol
SearchLayouts
SearchSettings
SecuritySettings
SharingBaseRule
SharingReason
SharingRecalculation
SharingRules
SharingSet
SiteDotCom
Skill
SocialCustomerServiceSettings
StandardValueSet
StandardValueSetTranslation
StaticResource
SynonymDictionary
Territory
Territory2
Territory2Model
Territory2Rule
Territory2Settings
Territory2Type
TopicsForObjects
TransactionSecurityPolicy
Translations
ValidationRule
WaveApplication
WaveDashboard
WaveDataflow
WaveDataset
WaveLens
WaveTemplateBundle
WaveXmd
WebLink
Workflow`;
        cmp.set('v.metadataTypes', metadataTypeList.split('\n'));
    },

    onSelectedMetadataTypeChanged: function (cmp, event, helper) {
        var selectedType = cmp.get('v.selectedMetadataType').trim();
        if (selectedType === '-None-') {
            cmp.set('v.metadataItems', []);
        } else {
            var spinner = cmp.find('spinner');
            $A.util.removeClass(spinner, "slds-hide");
            var metadataService = cmp.find('metadataService');
            metadataService.getMetadataItemListAsync(selectedType)
                .then(function (items) {
                    var callback = $A.getCallback(function () {
                        cmp.set('v.metadataItems', items.map(function (item) { return { name: item, content: '' }}));
                        $A.util.addClass(spinner, "slds-hide");
                    });
                    callback();
                })
                .catch(function (error) {
                    var callback = $A.getCallback(function () {
                        cmp.set('v.metadataItems', []);
                        $A.util.addClass(spinner, "slds-hide");
                        helper.showError(error);
                    });
                    callback();
                });
        }
    },

    onItemClick: function (cmp, event, helper) {
        var type = cmp.get('v.selectedMetadataType');
        var name = event.target.dataset.name;
        var metadataItem = cmp.get('v.metadataItems').find(function (item) { return item.name === name; });
        if (metadataItem.content) {
            return;
        }
        var spinner = cmp.find('spinner');
        $A.util.removeClass(spinner, "slds-hide");
        var metadataService = cmp.find('metadataService');
        metadataService.getMetadataItemAsync(type, name)
            .then(function (itemContent) {
                var callback = $A.getCallback(function () {
                    metadataItem.content = itemContent;
                    cmp.set('v.metadataItems', cmp.get('v.metadataItems'));
                    $A.util.addClass(spinner, "slds-hide");
                });
                callback();
            })
            .catch(function (error) {
                var callback = $A.getCallback(function () {
                    metadataItem.content = 'Failed';
                    cmp.set('v.metadataItems', cmp.get('v.metadataItems'));
                    $A.util.addClass(spinner, "slds-hide");
                    helper.showError(error);
                });
                callback();
            });
    }
})
