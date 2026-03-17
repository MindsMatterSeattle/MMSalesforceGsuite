//////////////////////////////////////////////////////////////////////////////////////////
//
// Setup helpers — called by the Admin Dashboard Setup tab and by the README
// deployment steps.  All functions are idempotent (safe to run more than once).
//
//////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the three recommended time-based triggers if they are not already present.
 * Safe to run repeatedly — skips any trigger whose handler function already exists.
 * @returns {{created: string[], alreadyExisted: string[]}}
 */
function setupTriggers() {
  var existing = ScriptApp.getProjectTriggers()
    .map(function(t) { return t.getHandlerFunction(); });
  var specs = [
    { fn: 'auditActive',                 type: 'daily',    hour: 2 },
    { fn: 'syncGoogleWithSalesforce_v2', type: 'hourly12'           },
    { fn: 'run_merge',                   type: 'hourly12'           }
  ];
  var created = [];
  specs.forEach(function(s) {
    if (existing.indexOf(s.fn) !== -1) return;
    if (s.type === 'daily') {
      ScriptApp.newTrigger(s.fn).timeBased().everyDays(1).atHour(s.hour).create();
    } else {
      ScriptApp.newTrigger(s.fn).timeBased().everyHours(12).create();
    }
    created.push(s.fn);
  });
  return { created: created, alreadyExisted: existing };
}

/**
 * Returns a default groups configuration suitable for any Minds Matter chapter.
 * Includes 10 fixed role-based groups plus 3 student cohort groups and
 * 3 matching mentor groups based on the current calendar year (Y, Y+1, Y+2).
 * Filters mirror the Seattle chapter configuration.
 * @returns {Object} groups config in the same shape as groups_config_dict[domain]
 */
function getDefaultGroupsConfig() {
  var config = {};

  // ── Fixed groups ─────────────────────────────────────────────────────────────
  config['active'] = {
    filters: [{ column: 'Status', condition: 'equals', value: 'Current' }],
    combination: 'or',
    name: 'Minds Matter All Members',
    description: 'All active Minds Matter members',
    do_remove: true
  };
  config['volunteers'] = {
    filters: [{ column: 'Engagement Type', condition: 'equals', value: 'Volunteer' }],
    name: 'Minds Matter Volunteers',
    description: 'Minds Matter Volunteers',
    do_remove: true
  };
  config['students'] = {
    filters: [{ column: 'Engagement Type', condition: 'equals', value: 'High School Student' }],
    name: 'Minds Matter Students',
    description: 'All current Minds Matter high school students',
    do_remove: true
  };
  config['ec'] = {
    filters: [{ column: 'Leadership', condition: 'contains', value: 'Chapter Executive Committee' }],
    name: 'Minds Matter Executive Committee',
    description: 'Minds Matter Executive Committee',
    do_remove: true
  };
  config['board'] = {
    filters: [
      { column: 'Leadership',     condition: 'contains', value: 'Chapter Board' },
      { column: 'Leadership Sub-Role', condition: 'contains', value: 'President/CEO' }
    ],
    combination: 'or',
    name: 'Minds Matter Board and ED',
    description: 'Minds Matter Board members and Executive Director',
    do_remove: true
  };
  config['boardonly'] = {
    filters: [{ column: 'Leadership', condition: 'contains', value: 'Chapter Board' }],
    name: 'Minds Matter Board Only',
    description: 'Minds Matter Board members (no ED)',
    do_remove: true
  };
  config['wct-instructors'] = {
    filters: [
      { column: 'Role (Non-Leadership)', condition: 'contains', value: 'Instructor  W&CT or Enrichment' },
      { column: 'Leadership Sub-Role',   condition: 'contains', value: 'Program Director  W&CT/Enrichment' }
    ],
    combination: 'or',
    name: 'Minds Matter Writing and Critical Thinking Instructors',
    description: 'Minds Matter Writing and Critical Thinking Instructors',
    do_remove: true
  };
  config['testprep-instructors'] = {
    filters: [
      { column: 'Role (Non-Leadership)', condition: 'contains', value: 'Instructor  Test Prep' },
      { column: 'Leadership Sub-Role',   condition: 'contains', value: 'Program Director  Test Prep' }
    ],
    combination: 'or',
    name: 'Minds Matter Test Prep Instructors',
    description: 'Minds Matter Test Prep Instructors',
    do_remove: true
  };
  config['math-instructors'] = {
    filters: [
      { column: 'Role (Non-Leadership)', condition: 'contains', value: 'Instructor  Math' },
      { column: 'Leadership Sub-Role',   condition: 'contains', value: 'Program Director  Math' }
    ],
    combination: 'or',
    name: 'Minds Matter Math Instructors',
    description: 'Minds Matter Math Instructors',
    do_remove: true
  };
  config['summerprograms'] = {
    filters: [{ column: 'Leadership Sub-Role', condition: 'contains', value: 'Director of Summer Programs' }],
    combination: 'or',
    name: 'Minds Matter Summer Programs',
    description: 'Minds Matter Summer Program Directors',
    do_remove: true
  };

  // ── Year-based cohort groups (current year + 2 future years) ─────────────────
  var currentYear = new Date().getFullYear();
  for (var i = 0; i < 3; i++) {
    var yr = currentYear + i;
    var yrStr = String(yr);

    config['students' + yrStr] = {
      filters: [
        { column: 'Engagement Type', condition: 'equals', value: 'High School Student' },
        { column: 'Year',            condition: 'equals', value: yr }
      ],
      combination: 'and',
      name: 'Minds Matter Students Graduating ' + yrStr,
      description: 'Minds Matter Students graduating in ' + yrStr
    };

    config[yrStr + 'mentors'] = {
      filters: [
        { column: 'Role (Non-Leadership)',    condition: 'contains', value: 'Mentor' },
        { column: 'Student Year Association', condition: 'equals',   value: yrStr }
      ],
      combination: 'and',
      name: 'Minds Matter Mentors for Students Graduating ' + yrStr,
      description: 'Minds Matter Mentors for Students Graduating ' + yrStr,
      do_remove: true
    };
  }

  return config;
}

function createSpreadsheet(name, sheetName, columnNames) {
    // Create a new Google sheet and return the sheet ID.
    // Arguments:
    //  - name: name of the Google sheet
    //  - sheetName: optional; set name of first sheet in Google sheet. 
    //      default is null.
    //  - columnNames (array): list of column names to set in first row of sheet.
    var sheet = SpreadsheetApp.create(name);

    activeSheet = sheet.getActiveSheet();
    activeSheet.setName(sheetName);


    var n_columns = columnNames.length;
    var first_row = activeSheet.getRange(1, 1, 1, n_columns);
    first_row.setValues([columnNames]);
    Logger.log('Spreadshet URL: ' + sheet.getUrl());

    return sheet.getId();
}


function setupSpreadsheets() {
    // Checks for script properties 'newUserSheetID' and 'userSuspensionSheetID'
    // If properties are not set, this function will:
    //  1. Create google sheets "User Creation" and "UserSuspension"
    //  2. Set script properties to the respective sheet IDs.

    var scriptProperties = PropertiesService.getScriptProperties();
    var propertiesToCheck = {
        "newUserSheetID": ["User Creation", "Sheet1"],
        "userSuspensionSheetID": ["UserSuspension", "SuspendedUsers"]
    }

    sheetColumnsMap = {
        "Sheet1": ["First Name", "mmemail", "privateEmail", "password"],
        "SuspendedUsers": ["Name", "Email"]
    }

    for (var key in propertiesToCheck) {
        var prop = scriptProperties.getProperty(key);
        if (!prop) {
            var sheetProperties = propertiesToCheck[key];
            var spreadsheetName = sheetProperties[0], gsheetName = sheetProperties[1];
            var colNames = sheetColumnsMap[gsheetName];
            var sheetID = createSpreadsheet(spreadsheetName, sheetName = gsheetName, columnNames = colNames);
            scriptProperties.setProperty(key, sheetID);
        }
    }
}

