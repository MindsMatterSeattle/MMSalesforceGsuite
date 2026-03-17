/**
 * groups_conf.js — Google Group membership rules, keyed by domain.
 *
 * groups_config_dict maps each G Suite domain to a groups config object.
 * Each key in the config object is a Google Group prefix (e.g. "active" → active@domain).
 * Each group entry has:
 *
 *   filters      {Array}   One or more filter rules. Each rule has:
 *                            column    {string}  Salesforce spreadsheet column name
 *                            condition {string}  "equals" or "contains"
 *                            value     {*}       Value to match against
 *   combination  {string}  "or" — user matches if any filter passes (default: "and")
 *   name         {string}  Human-readable Google Group name
 *   description  {string}  Google Group description
 *   do_remove    {boolean} If true, members not matched by filters are removed from the group
 *
 * To add a new group, add an entry here and re-run setupGroups() + syncGoogleWithSalesforce_v2().
 */
var seattle_groups_config = {
    "active": {
        "filters": [
            {
                "column": "Status",
                "condition": "equals",
                "value": "Current"
            },
        ],
        "combination": "or",
        "name": "Minds Matter Seattle All",
        "description": "All Minds Matter Seattle active members",
        "do_remove": true
    },
    "boardfinance":{
        "filters": [
              {
                  "column": "Leadership Sub-Role",
                  "condition": "contains",
                  "value": "Chief Finance Officer"
              }
          ],
        "name": "Minds Matter Seattle Board Finance Administrators",
        "description": "Minds Matter Seattle Board Finance Administrators",
        "do_remove": true
    },
    "board": {
        "filters": [
            {
                "column": "Leadership",
                "condition": "contains",
                "value": "Chapter Board"
            },
            {
              "column": "Leadership Sub-Role",
              "condition": "contains",
              "value": "President/CEO"
            }
        ],
         "combination": "or",
        "name": "Minds Matter of Seattle Board and ED",
        "description": "Minds Matter of Seattle Board and ED",
        "do_remove": true
    },
        "boardonly": {
        "filters": [
            {
                "column": "Leadership",
                "condition": "contains",
                "value": "Chapter Board"
            }
        ],
        "name": "Minds Matter of Seattle Board Only",
        "description": "Minds Matter of Seattle Board, no ED",
        "do_remove": true
    },
    "ec": {
        "filters": [
            {
                "column": "Leadership",
                "condition": "contains",
                "value": "Chapter Executive Committee"
            }
        ],
        "name": "Minds Matter Executive Council",
        "description": "Minds Matter Executive Council",
        "do_remove": true
    },
    "volunteers": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "Volunteer"
            }
        ],
        "name": "Minds Matter Volunteers",
        "description": "Minds Matter  Volunteers",
        "do_remove": true
    },
    "wct-instructors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Instructor  W&CT or Enrichment"
            },
            {
                "column": "Leadership Sub-Role",
                "condition": "contains",
                "value": "Program Director  W&CT/Enrichment"
            }
        ],
        "combination": "or",
        "name": "Minds Matter Writing and Critical Thinking Instructors",
        "description": "Minds Matter Writing and Critical Thinking Instructors",
        "do_remove": true
    },
    "testprep-instructors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Instructor  Test Prep"
            },
            {
                "column": "Leadership Sub-Role",
                "condition": "contains",
                "value": "Program Director  Test Prep"
            }
        ],
        "combination": "or",
        "name": "Minds Matter Test Prep Instructors",
        "description": "Minds Matter Test Prep Instructors",
        "do_remove": true
    },
    "senior-enrichment-instructors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "College Coach"
            },
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "College Application Support"
            },
            {
                "column": "Leadership Sub-Role",
                "condition": "contains",
                "value": "Program Director  Senior"
            }
        ],
        "combination": "or",
        "name": "Minds Matter Senior Enrichment Instructors",
        "description": "Minds Matter Senior Enrichment Instructors",
        "do_remove": true
    },
     "college-counseling": {
        "filters": [
            {
                "column": "Leadership Sub-Role",
                "condition": "contains",
                "value": "Program Director  College Advising"
            }
        ],
        "combination": "or",
        "name": "Minds Matter College Advising",
        "description": "Minds Matter College Advising",
        "do_remove": true
    },
    "summerprograms": {
        "filters": [
            {
                "column": "Leadership Sub-Role",
                "condition": "contains",
                "value": "Director of Summer Programs"
            }
        ],
        "combination": "or",
        "name": "Minds Matter Summer Program Directors",
        "description": "Minds Matter Summer Program Directors",
        "do_remove": true
    },
    "math-instructors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Instructor  Math"
            },
            {
                "column": "Leadership Sub-Role",
                "condition": "contains",
                "value": "Program Director  Math"
            }
        ],
        "combination": "or",
        "name": "Minds Matter Math Instructors",
        "description": "Minds Matter Math Instructors",
        "do_remove": true
    },
    "students2025": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2025
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2025",
        "description": "Minds Matter Students Graduating 2025"
    },
    "students2022": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2022
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2022",
        "description": "Minds Matter Students Graduating 2022"
    },
    "students2023": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2023
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2023",
        "description": "Minds Matter Students Graduating 2023"
    },
    "students2024": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2024
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2024",
        "description": "Minds Matter Students Graduating 2024"
    },
    "students2027": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2027
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2027",
        "description": "Minds Matter Students graduating in 2027"
    },
    "students2028": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2028
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2028",
        "description": "Minds Matter Students graduating in 2028"
    },
    "2027mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "2027"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2027",
        "description": "Minds Matter Mentors for Students Graduating 2027",
        "do_remove": true
    },
    "2028mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "2028"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2028",
        "description": "Minds Matter Mentors for Students Graduating 2028",
        "do_remove": true
    },
    "2026mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "2026"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2026",
        "description": "Minds Matter Mentors for Students Graduating in 2026",
        "do_remove": true
    },
    "2025mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "2025"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2025",
        "description": "Minds Matter Mentors for Students Graduating 2025",
        "do_remove": true
    },
    "2022mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "2022"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2022",
        "description": "Minds Matter Mentors for Students Graduating 2022",
        "do_remove": true
    },
    "2023mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "2023"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2023",
        "description": "Minds Matter Mentors for Students Graduating 2023",
        "do_remove": true
    },
    "2024mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "2024"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2024",
        "description": "Minds Matter Mentors for Students Graduating 2024",
        "do_remove": true
    },
    "newstudents": {
        filters: [{
            "column": "Leadership Sub-Role",
            "condition": "contains",
            "value": "Director of Mentees"
        }],
        "combination": "and",
        "name": "Minds Matter Seattle Student Recruiting",
        "description": "Email Alias for the Minds Matter Student Recruitement teams",
        "do_remove": true
    },
    "volunteer-ops": {
        filters: [{
            "column": "Leadership Sub-Role",
            "condition": "contains",
            "value": "Director of Volunteers"
        }],
        "combination": "and",
        "name": "Minds Matter Seattle Volunteer Operations",
        "description": "Email Alias for the Minds Matter Volunteer Ops Team",
        "do_remove": true
    }
}


var co_groups_config = {
    "active": {
        "filters": [
            {
                "column": "Status",
                "condition": "equals",
                "value": "Current"
            },
        ],
        "combination": "or",
        "name": "Minds Matter Seattle All",
        "description": "All Minds Matter Seattle active members",
        "do_remove": true
    },
    "board": {
        "filters": [
            {
                "column": "Leadership",
                "condition": "contains",
                "value": "Chapter Board"
            }
        ],
        "name": "Minds Matter of Colorado Board",
        "description": "Minds Matter of Colorado Board",
        "do_remove": true
    },
    "lt": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "Employee"
            }
        ],
        "name": "Minds Matter Colorado Leadership",
        "description": "Minds Matter Colorado Leadership",
        "do_remove": true
    },
    "ec": {
        "filters": [
            {
                "column": "Leadership",
                "condition": "contains",
                "value": "Chapter Executive Committee"
            }
        ],
        "name": "Minds Matter Executive Council",
        "description": "Minds Matter Executive Council",
        "do_remove": true
    },
    "volunteers": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "Volunteer"
            }
        ],
        "name": "Minds Matter Volunteers",
        "description": "Minds Matter Volunteers",
        "do_remove": true
    },
    "2021mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2021
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2021",
        "description": "Minds Matter Students Graduating 2021"
    },
    "2022mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2022
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2022",
        "description": "Minds Matter Students Graduating 2022"
    },
    "2023mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2023
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2023",
        "description": "Minds Matter Students Graduating 2023"
    },
    "2021mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Senior"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2021",
        "description": "Minds Matter Mentors for Students Graduating 2021",
        "do_remove": false
    },
    "2022mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Junior"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2022",
        "description": "Minds Matter Mentors for Students Graduating 2022",
        "do_remove": false
    },
    "2023mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Sophomore"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2023",
        "description": "Minds Matter Mentors for Students Graduating 2023",
        "do_remove": false
    },
    "gw-2021mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2021
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - George Washington HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2021 at GW site",
        "description": "Minds Matter Students Graduating 2021 at GW site"
    },
    "gw-2022mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2022
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - George Washington HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2022 at GW site",
        "description": "Minds Matter Students Graduating 2022 at GW site"
    },
    "gw-2023mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2023
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - George Washington HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2023 at GW site",
        "description": "Minds Matter Students Graduating 2023 at GW site"
    },
    "gw-2021mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Senior"
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - George Washington HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2021 at GW site",
        "description": "Minds Matter Mentors for Students Graduating 2021 at GW site",
        "do_remove": false
    },
    "gw-2022mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Junior"
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - George Washington HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2022 at GW site",
        "description": "Minds Matter Mentors for Students Graduating 2022 at GW site",
        "do_remove": false
    },
    "gw-2023mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Sophomore"
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - George Washington HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2023 at GW site",
        "description": "Minds Matter Mentors for Students Graduating 2023 at GW site",
        "do_remove": false
    },
    "dmlk-2021mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2021
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - MLK Early College"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2021 at MLK site",
        "description": "Minds Matter Students Graduating 2021 at MLK site"
    },
    "dmlk-2022mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2022
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - MLK Early College"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2022 at MLK site",
        "description": "Minds Matter Students Graduating 2022 at MLK site"
    },
    "dmlk-2023mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2023
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - MLK Early College"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2023 at MLK site",
        "description": "Minds Matter Students Graduating 2023 at MLK site"
    },
    "dmlk-2021mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Senior"
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - MLK Early College"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2021 at MLK site",
        "description": "Minds Matter Mentors for Students Graduating 2021 at MLK site",
        "do_remove": false
    },
    "dmlk-2022mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Junior"
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - MLK Early College"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2022 at MLK site",
        "description": "Minds Matter Mentors for Students Graduating 2022 at MLK site",
        "do_remove": false
    },
    "dmlk-2023mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Sophomore"
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - MLK Early College"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2023 at MLK site",
        "description": "Minds Matter Mentors for Students Graduating 2023 at MLK site",
        "do_remove": false
    },
    "west-2021mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2021
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - West HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2021 at West site",
        "description": "Minds Matter Students Graduating 2021 at West site"
    },
    "west-2022mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2022
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - West HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2022 at West site",
        "description": "Minds Matter Students Graduating 2022 at West site"
    },
    "west-2023mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2023
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - West HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2023 at West site",
        "description": "Minds Matter Students Graduating 2023 at West site"
    },
    "west-2021mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Senior"
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - West HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2021 at West site",
        "description": "Minds Matter Mentors for Students Graduating 2021 at West site",
        "do_remove": false
    },
    "west-2022mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Junior"
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - West HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2022 at West site",
        "description": "Minds Matter Mentors for Students Graduating 2022 at West site",
        "do_remove": false
    },
    "west-2023mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Sophomore"
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Denver - West HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2023 at West site",
        "description": "Minds Matter Mentors for Students Graduating 2023 at West site",
        "do_remove": false
    },
    "harrison-2023mentees": {
        "filters": [
            {
                "column": "Engagement Type",
                "condition": "equals",
                "value": "High School Student"
            },
            {
                "column": "Year",
                "condition": "equals",
                "value": 2023
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Colorado Springs - Harrison HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Students Graduating 2023 at Harrison site",
        "description": "Minds Matter Students Graduating 2023 at Harrison site"
    },
    "harrison-2023mentors": {
        "filters": [
            {
                "column": "Role (Non-Leadership)",
                "condition": "contains",
                "value": "Mentor"
            },
            {
                "column": "Student Year Association",
                "condition": "equals",
                "value": "Sophomore"
            },
            {
                "column": "Site (Colorado)",
                "condition": "equals",
                "value": "Colorado Springs - Harrison HS"
            }
        ],
        "combination": "and",
        "name": "Minds Matter Mentors for Students Graduating 2023 at Harrison site",
        "description": "Minds Matter Mentors for Students Graduating 2023 at Harrison site",
        "do_remove": false
    }
}

var groups_config_dict = {
    'mindsmatterseattle.org': seattle_groups_config,
    'mindsmatterco.org': co_groups_config
}
