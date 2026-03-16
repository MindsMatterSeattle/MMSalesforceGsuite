// ─── Utility ─────────────────────────────────────────────────────────────────

function getProperty(propertyName) {
  return PropertiesService.getScriptProperties().getProperty(propertyName);
}

function setProperty(propertyName, propertyValue) {
  PropertiesService.getScriptProperties().setProperty(propertyName, propertyValue);
}

/**
 * Saves a single script property from the web UI.
 * Called by the Configuration tab whenever a field value changes.
 */
function saveScriptVariable(name, value) {
  PropertiesService.getScriptProperties().setProperty(name, value);
}

// ─── Web App Entry Point ──────────────────────────────────────────────────────

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index.html')
    .setTitle('MM Admin Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Returns the current app version string defined in version.gs. */
function getAppVersion() {
  return APP_VERSION;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * Returns all data needed to render the Dashboard tab.
 */
function getDashboardData() {
  var props = PropertiesService.getScriptProperties();

  var suspensionCount = 0;
  try { suspensionCount = getUserSuspensionRowCount(); } catch(e) {}

  var contactStatus = { unprocessedCount: 0, errorCount: 0 };
  try { contactStatus = getContactUpdateStatus(); } catch(e) {}

  return {
    pendingSuspensions:  suspensionCount,
    contactPending:      contactStatus.unprocessedCount,
    contactErrors:       contactStatus.errorCount,
    syncStatus:          props.getProperty('syncGoogleWithSalesforce_v2_status') || 'No data',
    syncTimestamp:       props.getProperty('syncGoogleWithSalesforce_v2_timestamp') || '--',
    mergeStatus:         props.getProperty('run_merge_status') || 'No data',
    mergeTimestamp:      props.getProperty('run_merge_timestamp') || '--',
    dryRun:              props.getProperty('dry_run') === 'true'
  };
}

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Returns all editable script variables grouped for display in the Config tab.
 */
// Properties marked required:true must be set before most sync functions will work.
var SCRIPT_VARIABLES = [
  // Domain
  { name: 'domainname',              label: 'Domain Name',                    type: 'text',     required: true  },
  // Spreadsheets
  { name: 'salesforceSpreadSheetID', label: 'Salesforce Spreadsheet ID',      type: 'sheet',    required: true  },
  { name: 'salesforceSheetName',     label: 'Salesforce Sheet Tab Name',      type: 'text',     required: true  },
  { name: 'newUserSheetID',          label: 'New User Creation Sheet ID',     type: 'sheet',    required: true  },
  { name: 'userSuspensionSheetID',   label: 'User Suspension Sheet ID',       type: 'sheet',    required: true  },
  { name: 'contactMailMergeSheetID', label: 'Contact Mail Merge Sheet ID',    type: 'sheet',    required: false },
  // Email / Mail Merge
  { name: 'newAccountDraftID',       label: 'New Account Welcome Draft ID',   type: 'draft',    required: false },
  { name: 'AccountUpdateDraftID',    label: 'Contact Update Email Draft ID',  type: 'draft',    required: false },
  // Salesforce API
  { name: 'sfUsername',              label: 'Salesforce Username',            type: 'text',     required: false },
  { name: 'sfAuthToken',             label: 'Salesforce Auth Token',          type: 'password', required: false },
  { name: 'sfPassword',              label: 'Salesforce Password',            type: 'password', required: false },
  // Other
  { name: 'protectedAccounts',       label: 'Protected Accounts (comma-sep)', type: 'text',     required: false },
  { name: 'contactUpdateFormId',     label: 'Contact Update Form ID',         type: 'text',     required: false },
  { name: 'dry_run',                 label: 'Dry Run Mode',                   type: 'checkbox', required: false },
  { name: 'do_remove_default',       label: 'Remove Unlisted Members (default)', type: 'checkbox', required: false }
];

function getScriptVariablesData() {
  var props = PropertiesService.getScriptProperties();
  return SCRIPT_VARIABLES.map(function(v) {
    return {
      name:     v.name,
      label:    v.label,
      value:    props.getProperty(v.name) || '',
      type:     v.type,
      required: v.required
    };
  });
}

/**
 * Returns a list of required properties that are not yet set.
 * Called on page load so the UI can surface a setup warning.
 */
function getSetupStatus() {
  var props = PropertiesService.getScriptProperties();
  var missing = SCRIPT_VARIABLES
    .filter(function(v) { return v.required && !props.getProperty(v.name); })
    .map(function(v) { return { name: v.name, label: v.label }; });
  return { allSet: missing.length === 0, missing: missing };
}

// ─── Sheets Links ─────────────────────────────────────────────────────────────

function getSheetsData() {
  var props = PropertiesService.getScriptProperties();
  var sheetDefs = [
    { id: props.getProperty('salesforceSpreadSheetID'), name: 'Salesforce Current Contacts' },
    { id: props.getProperty('newUserSheetID'),          name: 'New User Account Creation' },
    { id: props.getProperty('userSuspensionSheetID'),   name: 'User Suspension' },
    { id: props.getProperty('contactMailMergeSheetID'), name: 'Contact Mail Merge' }
  ];

  return sheetDefs
    .filter(function(s) { return !!s.id; })
    .map(function(s) {
      try {
        return { name: s.name, url: SpreadsheetApp.openById(s.id).getUrl() };
      } catch(e) {
        return { name: s.name, url: null };
      }
    });
}

// ─── User Management ──────────────────────────────────────────────────────────

function getUserSuspensionRowCount() {
  var id = PropertiesService.getScriptProperties().getProperty('userSuspensionSheetID');
  var sheet = SpreadsheetApp.openById(id).getSheetByName('SuspendedUsers');
  return Math.max(0, sheet.getLastRow() - 1);
}

/**
 * Returns the full list of users pending suspension as [{name, email}].
 */
function getSuspendedUsersList() {
  var id = PropertiesService.getScriptProperties().getProperty('userSuspensionSheetID');
  var sheet = SpreadsheetApp.openById(id).getSheetByName('SuspendedUsers');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  return values.map(function(row) { return { name: row[0], email: row[1] }; });
}

/**
 * Runs the audit that populates the SuspendedUsers sheet.
 * Returns updated count after running.
 */
function runAuditActive() {
  auditActive();
  return getUserSuspensionRowCount();
}

/**
 * Suspends all users in the SuspendedUsers sheet.
 * Returns updated count (should be 0 after success).
 */
function runSuspendUsers() {
  suspendUsers();
  return getUserSuspensionRowCount();
}

/**
 * Suspends a single user by email and removes their row from the SuspendedUsers sheet.
 * @param {string} email - the user's primary email address
 * @returns {number} updated row count after removal
 */
function suspendSingleUser(email) {
  var user = AdminDirectory.Users.get(email);
  user.suspended = true;
  AdminDirectory.Users.update(user, email);
  console.log({ message: 'User Suspended', email: email });

  // Remove the row from the SuspendedUsers sheet
  var id = PropertiesService.getScriptProperties().getProperty('userSuspensionSheetID');
  var sheet = SpreadsheetApp.openById(id).getSheetByName('SuspendedUsers');
  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === email.trim()) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
  return getUserSuspensionRowCount();
}

/**
 * Triggers the main Salesforce -> Google sync.
 */
function runSyncGoogleWithSalesforce() {
  syncGoogleWithSalesforce_v2();
  return 'Sync complete';
}

// ─── Contact Updates ──────────────────────────────────────────────────────────

/**
 * Returns counts from the contact update form response sheet.
 */
function getContactUpdateStatus() {
  var formId = PropertiesService.getScriptProperties().getProperty('contactUpdateFormId');
  if (!formId) return { unprocessedCount: 0, errorCount: 0 };

  var form = FormApp.openById(formId);
  var destId = form.getDestinationId();
  if (!destId) return { unprocessedCount: 0, errorCount: 0 };

  var sheet = SpreadsheetApp.openById(destId).getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { unprocessedCount: 0, errorCount: 0 };

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var statusIdx = headers.indexOf('UpdateStatus');
  if (statusIdx === -1) return { unprocessedCount: 0, errorCount: 0 };

  var values = sheet.getRange(2, statusIdx + 1, lastRow - 1, 1).getValues();
  var unprocessedCount = 0, errorCount = 0;
  values.forEach(function(row) {
    if (row[0] === '') unprocessedCount++;
    else if (row[0] !== 'Done') errorCount++;
  });
  return { unprocessedCount: unprocessedCount, errorCount: errorCount };
}

function runCreatePrefilledLinks() {
  create_prefilled_links();
  return 'Form links generated';
}

function runSendMailMergeEmails() {
  send_mail_merge_emails();
  return 'Emails sent';
}

function runUpdateSalesforceContactInfo() {
  update_salesforce_contact_info();
  return getContactUpdateStatus();
}

/** Sends new-account welcome emails from the new user sheet. */
function runRunMerge() {
  run_merge();
  return 'New account emails sent';
}

// ─── Groups Configuration ─────────────────────────────────────────────────────

/**
 * Returns the groups config for the current domain as a plain object.
 * If a UI-edited version is stored in script properties, returns that;
 * otherwise seeds from the hardcoded groups_conf.js and saves it.
 */
/**
 * Returns the column header names from the Salesforce spreadsheet's first row.
 * Used by the Groups tab to populate column-name dropdowns in filter rows.
 */
function getSalesforceColumns() {
  var props = PropertiesService.getScriptProperties();
  var sheetId   = props.getProperty('salesforceSpreadSheetID');
  var sheetName = props.getProperty('salesforceSheetName');
  if (!sheetId) throw new Error('salesforceSpreadSheetID is not set.');
  var ss    = SpreadsheetApp.openById(sheetId);
  var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
  if (!sheet) throw new Error('Sheet "' + sheetName + '" not found.');
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function(h) { return String(h).trim(); })
    .filter(function(h) { return h.length > 0; });
}

/**
 * Returns distinct non-empty values from the named column in the Salesforce sheet.
 * Used by the Groups tab to populate value-field suggestions.
 * @param {string} columnName - header text to look up
 * @returns {string[]} sorted unique values
 */
function getSalesforceColumnValues(columnName) {
  var props = PropertiesService.getScriptProperties();
  var sheetId   = props.getProperty('salesforceSpreadSheetID');
  var sheetName = props.getProperty('salesforceSheetName');
  if (!sheetId) throw new Error('salesforceSpreadSheetID is not set.');
  var ss    = SpreadsheetApp.openById(sheetId);
  var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
  if (!sheet) throw new Error('Sheet "' + sheetName + '" not found.');
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastCol < 1 || lastRow < 2) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var colIdx = -1;
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === columnName) { colIdx = i; break; }
  }
  if (colIdx === -1) return [];
  var values = sheet.getRange(2, colIdx + 1, lastRow - 1, 1).getValues();
  var seen = {};
  values.forEach(function(row) {
    var v = String(row[0]).trim();
    if (v) seen[v] = true;
  });
  return Object.keys(seen).sort();
}

function getGroupsConfig() {
  var domainname = PropertiesService.getScriptProperties().getProperty('domainname');
  var key = 'groupsConfig_' + domainname;
  var stored = PropertiesService.getScriptProperties().getProperty(key);
  if (stored) {
    return { domainname: domainname, config: JSON.parse(stored) };
  }
  // Seed from hardcoded config and persist so future edits are based on it.
  var initial = groups_config_dict[domainname] || {};
  PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(initial));
  return { domainname: domainname, config: initial };
}

/**
 * Saves an updated groups config (as a JSON string) to script properties.
 * @param {string} domainname
 * @param {string} configJson - JSON-serialized groups config object
 */
function saveGroupsConfig(domainname, configJson) {
  // Validate it parses before saving.
  JSON.parse(configJson);
  PropertiesService.getScriptProperties().setProperty('groupsConfig_' + domainname, configJson);
  return 'Saved';
}

// ─── Gmail Drafts ─────────────────────────────────────────────────────────────

/**
 * Returns the list of Gmail drafts in the admin account, each with enough
 * information for the UI to render a picker and a direct Gmail link.
 * @returns {{id: string, subject: string, gmailUrl: string}[]}
 */
function getGmailDrafts() {
  return GmailApp.getDrafts().map(function(d) {
    var msg = d.getMessage();
    var subject = msg.getSubject() || '(no subject)';
    var threadId = msg.getThread().getId();
    return {
      id:       d.getId(),
      subject:  subject,
      gmailUrl: 'https://mail.google.com/mail/#drafts/' + threadId
    };
  });
}

// ─── Legacy / Script Status ───────────────────────────────────────────────────

function getScriptStatusData() {
  var props = PropertiesService.getScriptProperties();
  var scripts = [
    { name: 'syncGoogleWithSalesforce_v2', statusKey: 'syncGoogleWithSalesforce_v2_status', timestampKey: 'syncGoogleWithSalesforce_v2_timestamp' },
    { name: 'run_merge',                   statusKey: 'run_merge_status',                   timestampKey: 'run_merge_timestamp' }
  ];
  return scripts.map(function(s) {
    var status    = props.getProperty(s.statusKey);
    var timestamp = props.getProperty(s.timestampKey);
    return {
      name:   s.name,
      status: status ? (status + ' (Last run: ' + timestamp + ')') : 'No data available',
      error:  status === 'error'
    };
  });
}
