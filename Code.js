/**
 * Generates a random 6-character string used as a password suffix.
 * Characters are drawn from alphanumerics plus a set of special characters.
 *
 * @returns {string} A random 6-character string.
 */
function generateRandom() {
  var data = "xxxxxx";
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*-";
  var text = ""; //Reset text to empty string
  for (var j = 1; j <= data.length; j++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Creates a new Google Workspace user and logs their credentials to the new-user tracking sheet.
 * The generated password is "MM2019" + firstName + a random suffix; the user is required to
 * change it on first login.
 *
 * @param {string} firstName - User's first name.
 * @param {string} lastName - User's last name.
 * @param {string} default_email - Primary (org) email address to create.
 * @param {string} home_email - Personal/home email address.
 * @param {string} phone - Home phone number.
 * @param {boolean} dry_run - If true, skips the actual Admin Directory insert and sheet write.
 */
function addUser(firstName, lastName, default_email, home_email, phone, dry_run) {
  var userID = PropertiesService.getScriptProperties().getProperty('newUserSheetID');
  var ss = SpreadsheetApp.openById(userID);
  var sheet = ss.getSheets()[0]
  var pwd = "MM2019" + firstName + generateRandom();
  console.log('Creating User  %s, %s, %s', default_email, home_email, pwd)

  var user = {
    primaryEmail: default_email,
    name: {
      givenName: firstName,
      familyName: lastName
    },
    // Generate a random password string.
    password: pwd,
    changePasswordAtNextLogin: true,
    phones: [
      {
        primary: true,
        value: phone,
        type: "home"
      }
    ],
    emails: [{
      address: home_email,
      type: "home"
    }]
  };
  if (!dry_run) {
    try {
      user = AdminDirectory.Users.insert(user);
      sheet.appendRow([firstName, default_email, home_email, pwd]);
    }
    catch (e) {
      console.log("User %s insert failed: " + e, user)
    }
  }

  //Logger.log('%s',user);

}

/**
 * Adds a user to a Google Group if they are not already a member.
 *
 * @param {string} userEmail - Email address of the user to add.
 * @param {string} groupEmail - Email address of the target Google Group.
 * @param {boolean} dry_run - If true, skips the actual Admin Directory insert.
 */
function addGroupMember(userEmail, groupEmail, dry_run) {

  group = GroupsApp.getGroupByEmail(groupEmail)

  if (!group.hasUser(userEmail)) {
    var member = {
      email: userEmail,
      role: "MEMBER"
    };
    if (!dry_run) {
      member = AdminDirectory.Members.insert(member, groupEmail);
    }
    console.log("User %s added as a member of group %s.", userEmail, groupEmail);
  }
  else {
    console.log("User %s not added as a member of group %s because they are already member", userEmail, groupEmail);
  }
}

/**
 * Checks whether a Google Workspace user with the given email exists.
 *
 * @param {string} email - The primary email address to look up.
 * @returns {boolean} True if the user exists, false otherwise.
 */
function isUser(email) {
  try {
    var user = AdminDirectory.Users.get(email);
    return true;
  }
  catch (e) {
    console.log('user not found reason: ' + e);
    return false;
  }
}

/**
 * Audits a Google Group against an expected membership list.
 * - Optionally removes members who are not in correctEmails (and are not admin).
 * - Adds any expected members who are missing from the group.
 *
 * @param {GoogleAppsScript.Groups.Group} group - The Google Group object to audit.
 * @param {string[]} correctEmails - Array of email addresses that should be in the group.
 * @param {boolean} do_remove - If true, removes users not found in correctEmails.
 * @param {boolean} dry_run - If true, skips actual add/remove API calls.
 */
function auditGroup(group, correctEmails, do_remove, dry_run) {
  var domainname = PropertiesService.getScriptProperties().getProperty('domainname');
  var groupEmail = group.getEmail();
  console.log('auditing ' + groupEmail);
  // console.log('correctEmails' + correctEmails);
  users = group.getUsers();
  var found_correct = []
  for (ce = 0; ce < correctEmails.length; ce++) {
    found_correct.push(false);
  }
  // for all users in group validate that they should be there
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    var validated_user = false;
    for (var ce = 0; ce < correctEmails.length; ce++) {
      var correctEmail = correctEmails[ce];
      if (correctEmail.indexOf(user) != -1) {
        validated_user = true;
        found_correct[ce] = true;
      }

    }
    if (user == 'admin@' + domainname) {
      validated_user = true;
    }
    if (do_remove) {
      if (!validated_user) {
        // remove user
        if (!dry_run) {
          AdminDirectory.Members.remove(groupEmail, user.getEmail());
        }
        console.log('removing ' + user)
      }
    }

  }
  // for all users that should be in group make sure they are there
  for (var ce = 0; ce < correctEmails.length; ce++) {
    var correctEmail = correctEmails[ce];
    if (!found_correct[ce]) {
      addGroupMember(correctEmail, group.getEmail(), dry_run);
      Utilities.sleep(1000);
    }
  }
}

/**
 * Lists all the users in a domain sorted by first name.
 */
function listAllUsers() {
  var domainname = PropertiesService.getScriptProperties().getProperty('domainname');
  var pageToken;
  var page;
  var allUsers = []
  do {
    page = AdminDirectory.Users.list({
      domain: domainname,
      orderBy: 'givenName',
      maxResults: 100,
      pageToken: pageToken
    });
    var users = page.users;
    if (users) {
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        allUsers.push(user)
        //Logger.log('%s (%s)', user.name.fullName, user.primaryEmail);
      }
    } else {
      console.log('No users found.');
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
  return allUsers;
}

/**
 * Creates any Google Groups defined in groups_config_dict that do not yet exist in the domain.
 * Each newly created group has admin@<domain> added as an OWNER with delivery disabled.
 */
function setupGroups() {
  var domainname = PropertiesService.getScriptProperties().getProperty('domainname');
  var groups_config = groups_config_dict[domainname];
  var pageToken;
  var existing_groups = AdminDirectory.Groups.list({
    domain: domainname,
    maxResults: 200,
    pageToken: pageToken
  })
  var existingGroupEmails = []
  for (var group in existing_groups.groups) {
    existingGroupEmails.push(existing_groups.groups[group].email);
  }
  for (var group in groups_config) {
    if (existingGroupEmails.indexOf(group + "@" + domainname) == -1) {
      console.log("creating group: " + group + "@" + domainname);
      AdminDirectory.Groups.insert({
        email: group + "@" + domainname,
        name: groups_config[group].name,
        description: groups_config[group].description
      });
      Utilities.sleep(1000);
      var owner = {
        email: "admin@" + domainname,
        role: "OWNER",
        delivery_settings: "NONE"
      };
      AdminDirectory.Members.insert(owner, group + "@" + domainname);
    }

  }
}


/**
 * Checks whether a Google Workspace user appears in a spreadsheet by matching any of their
 * email addresses against a specified column.
 *
 * @param {Object} user - A Google Workspace user object (must have an `emails` array).
 * @param {Array[]} rows - 2D array of spreadsheet values (first row is headers).
 * @param {number} emailCol - Column index to search for email matches.
 * @returns {boolean} True if any of the user's emails is found in the column.
 */
function isUserByEmail(user, rows, emailCol) {
  for (var r = 1; r < rows.length; r++) {
    var email = rows[r][emailCol];
    for (var e = 0; e < user.emails.length; e++) {
      if (email.indexOf(user.emails[e].address) != -1) {
        return true;
      }
    }
  }
  return false;
}
/**
 * Checks whether a Google Workspace user appears in a spreadsheet by matching their full name
 * against concatenated first-name and last-name columns.
 *
 * @param {Object} user - A Google Workspace user object (must have a `name.fullName` string).
 * @param {Array[]} rows - 2D array of spreadsheet values (first row is headers).
 * @param {number} fCol - Column index for first name.
 * @param {number} lCol - Column index for last name.
 * @returns {boolean} True if the user's full name is found in the spreadsheet.
 */
function isUserbyName(user, rows, fCol, lCol) {
  for (var r = 1; r < rows.length; r++) {
    var fullname = rows[r][fCol] + " " + rows[r][lCol]
    if (fullname.indexOf(user.name.fullName) != -1) {
      return true;
    }

  }
  return false;
}

/**
 * Audits all active Google Workspace accounts against the Salesforce contact spreadsheet.
 * Any non-suspended, non-protected user not found (by name or email) in the active Salesforce
 * sheet is written to the "SuspendedUsers" sheet for manual review or automatic suspension.
 *
 * Reads script properties: salesforceSpreadSheetID, salesforceSheetName,
 * userSuspensionSheetID, protectedAccounts.
 */
function auditActive() {
  all_users = listAllUsers()
  var salesforceSpreadSheetID = PropertiesService.getScriptProperties().getProperty('salesforceSpreadSheetID');
  var ss = SpreadsheetApp.openById(salesforceSpreadSheetID);

  var salesforceSheetName = PropertiesService.getScriptProperties().getProperty('salesforceSheetName');
  var sheet = ss.getSheetByName(salesforceSheetName);

  var userSuspensionSheetID = PropertiesService.getScriptProperties().getProperty('userSuspensionSheetID');
  var suspendedSpreadSheet = SpreadsheetApp.openById(userSuspensionSheetID);
  var protectedAccounts = PropertiesService.getScriptProperties().getProperty('protectedAccounts');
  var suspendedSheet = suspendedSpreadSheet.getSheetByName("SuspendedUsers");
  var rangeData = sheet.getDataRange();
  var lastColumn = rangeData.getLastColumn();
  var rangeValues = rangeData.getValues();
  var user;
  var columnDict = {}

  for (i = 0; i < lastColumn; i++) {
    columnDict[rangeValues[0][i]] = i;
  }

  if (suspendedSheet.getMaxRows() > 1) {
    suspendedSheet.deleteRows(2, suspendedSheet.getMaxRows() - 1)
  }
  for (i = 1; i < all_users.length; i++) {
    user = all_users[i];
    if (!user.suspended) {
      if (protectedAccounts.indexOf(user.primaryEmail.split('@')[0]) == -1) {
        if (!isUserbyName(user, rangeValues, columnDict['First Name'], columnDict['Last Name'])) {
          //Logger.log("User not found by name in active salesforce: " + user.name.fullName);
          if (!isUserByEmail(user, rangeValues, columnDict['Email'])) {
            suspendedSheet.appendRow([user.name.fullName, user.primaryEmail])
            console.log({ message: 'User Marked For Suspension', fullName: user.name.fullName, email: user.primaryEmail });
          }
        }
      }
    }
  }
}

/**
 * Suspends all Google Workspace accounts listed in the "SuspendedUsers" sheet.
 * Reads script property: userSuspensionSheetID.
 */
function suspendUsers() {
  var userSuspensionSheetID = PropertiesService.getScriptProperties().getProperty('userSuspensionSheetID');
  var suspendedSpreadSheet = SpreadsheetApp.openById(userSuspensionSheetID);
  var suspendedSheet = suspendedSpreadSheet.getSheetByName("SuspendedUsers");

  var rangeData = suspendedSheet.getDataRange();
  var lastRow = rangeData.getLastRow();
  var rangeValues = rangeData.getValues();
  for (i = 1; i < lastRow; i++) {
    user_email = rangeValues[i][1]
    var user = AdminDirectory.Users.get(user_email);
    user.suspended = true;
    AdminDirectory.Users.update(user, user_email);
    console.log({ message: 'User Suspended', fullName: user.name.fullName, email: user.primaryEmail });

  }
}

/**
 * Main sync function: reconciles Google Workspace users and group memberships with the
 * Salesforce contact spreadsheet.
 *
 * Steps:
 *  1. Loads all Google Groups defined in groups_config_dict for the domain.
 *  2. Reads every contact row from the Salesforce spreadsheet.
 *  3. For each contact, derives the expected org email (firstname.lastname@domain).
 *  4. Creates a new Google Workspace account if the user doesn't already exist
 *     (skipped for contacts with Status == "Completed").
 *  5. Evaluates each group's filter rules (supports 'contains'/'equals' conditions
 *     combined with 'and'/'or' logic) to build the expected membership list.
 *  6. Calls auditGroup() for each group to add/remove members as needed.
 *
 * Reads script properties: domainname, salesforceSpreadSheetID, salesforceSheetName.
 * Controlled by the groups_config_dict configuration in groups_conf.js.
 */
function syncGoogleWithSalesforce_v2() {
  // dry_run can be toggled from the admin web UI via the 'dry_run' script property.
  var dry_run = PropertiesService.getScriptProperties().getProperty('dry_run') === 'true';
  // Falls back to true if not set — preserves existing behaviour.
  var do_remove_default = PropertiesService.getScriptProperties().getProperty('do_remove_default') !== 'false';
  var domainname = PropertiesService.getScriptProperties().getProperty('domainname');

  // Guard: required properties must be set before the sync can run.
  var required = ['domainname', 'salesforceSpreadSheetID', 'salesforceSheetName',
                  'newUserSheetID', 'userSuspensionSheetID'];
  var props = PropertiesService.getScriptProperties();
  var unset = required.filter(function(k) { return !props.getProperty(k); });
  if (unset.length > 0) {
    throw new Error('syncGoogleWithSalesforce_v2: missing required script properties: ' + unset.join(', ') +
                    '. Set these in the Admin Dashboard (Configuration tab) before running.');
  }

  // Use the groups config stored in script properties (editable via the admin UI) if present,
  // otherwise fall back to the hardcoded config in groups_conf.js.
  var groups_config_json = PropertiesService.getScriptProperties().getProperty('groupsConfig_' + domainname);
  var groups_config = groups_config_json ? JSON.parse(groups_config_json) : groups_config_dict[domainname];

  // Phase 1: Pre-load Google Group objects and initialize the expected-membership lists.
  // We fetch each Group object up front so we only make one GroupsApp API call per group,
  // rather than one per contact row below.
  groupDict = {}        // { group_str: Google Group object }
  correctEmailDict = {} // { group_str: [emails that should be in this group] }
  for (var group_str in groups_config) {
    google_group_obj = GroupsApp.getGroupByEmail(group_str + "@" + domainname);
    groupDict[group_str] = google_group_obj
    correctEmailDict[group_str] = []
    Utilities.sleep(1000) // avoid hitting the Groups API rate limit
  }

  // Phase 2: Load the Salesforce spreadsheet and build a column-name-to-index map so we
  // can look up any column by name instead of by hard-coded index numbers.
  var salesforceSpreadSheetID = PropertiesService.getScriptProperties().getProperty('salesforceSpreadSheetID');
  var ss = SpreadsheetApp.openById(salesforceSpreadSheetID);

  var salesforceSheetName = PropertiesService.getScriptProperties().getProperty('salesforceSheetName');
  var sheet = ss.getSheetByName(salesforceSheetName);

  var rangeData = sheet.getDataRange();
  var lastColumn = rangeData.getLastColumn();
  var lastRow = rangeData.getLastRow();
  var searchRange = sheet.getRange(1, 1, 1, lastColumn - 1);
  var rangeValues = searchRange.getValues();

  var columnDict = {} // { column_name_str: column_index_int }
  for (i = 0; i < lastColumn; i++) {
    columnDict[rangeValues[0][i]] = i;
  }

  data = rangeData.getValues();

  // Phase 3: Process each contact row (skip row 0, which is headers).
  for (i = 1; i < lastRow; i++) {
    phone = data[i][columnDict["Phone"]];

    // Derive the expected org email from First/Last Name: "first.last@domain".
    // Spaces are replaced with "." and apostrophes (e.g. O'Brien) are stripped.
    var email = data[i][columnDict["First Name"]].toLowerCase() + "." + data[i][columnDict["Last Name"]].toLowerCase() + "@" + domainname;
    email = email.replace(/ /g, ".")
                  .replace(/['\u2018\u2019]/g, ""); // strip straight and curly apostrophes

    var is_user = isUser(email);

    // Create a Google Workspace account if one doesn't exist yet.
    // Skip contacts whose Status is "Completed" -- these are alumni who have graduated
    // out of the program and should not get new accounts.
    if (!is_user) {
      if (columnDict["Status"] != "Completed") {
        addUser(data[i][columnDict['First Name']],
                data[i][columnDict['Last Name']],
                email,
                data[i][columnDict['Email']],
                data[i][columnDict['Phone']],
                false);
        is_user = true;
      }
    }

    // Phase 3b: Determine which groups this contact belongs to.
    // For each group, evaluate its filter list against this row and add the email to
    // correctEmailDict if the contact qualifies.
    for (var group_str in groups_config) {
      gc = groups_config[group_str]

      if (gc['combination'] == "or") {
        // OR logic: add the email as soon as any single filter matches.
        for (var k = 0; k < gc['filters'].length; k++) {
          var filt = gc['filters'][k]
          if (filt['condition'] == 'contains') {
            if (data[i][columnDict[filt['column']]].toString().indexOf(filt['value']) != -1) {
              correctEmailDict[group_str].push(email);
            }
          }
          if (filt['condition'] == 'equals') {
            if (data[i][columnDict[filt['column']]] == filt['value']) {
              correctEmailDict[group_str].push(email);
            }
          }
        }
      }
      else {
        // AND logic (default when 'combination' is absent): every filter must match.
        var isgood = true;
        for (var k = 0; k < gc['filters'].length; k++) {
          var filt = gc['filters'][k];
          if (filt['condition'] == 'contains') {
            if (data[i][columnDict[filt['column']]].toString().indexOf(filt['value']) == -1) {
              isgood = false;
            }
          }
          if (filt['condition'] == 'equals') {
            if (data[i][columnDict[filt['column']]] != filt['value']) {
              isgood = false;
            }
          }
        }
        if (isgood) {
          correctEmailDict[group_str].push(email);
        }
      }
    }
  }

  // Phase 4: Reconcile actual group memberships against the expected lists we just built.
  // auditGroup() will add missing members and (if do_remove is true) remove extra ones.
  console.log(correctEmailDict);
  for (var group_str in groups_config) {
    google_group = groupDict[group_str];
    var do_remove = groups_config[group_str]['do_remove']
    if (do_remove == null) {
      do_remove = do_remove_default;
    }
    auditGroup(google_group, correctEmailDict[group_str], do_remove, dry_run);
    Utilities.sleep(1000) // avoid hitting the Admin Directory API rate limit
  }
}
