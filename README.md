
# Minds Matter Salesforce Gsuite Deployment Instructions
	DRAFT: Last edited September 23, 2019

## Background
In 2018-2019 Minds Matter of Seattle’s board decided to undertake a project to improve knowledge management within the organization in order to make information more accessible and better spread institutional knowledge throughout the turnover of volunteers.  Like many organizations, there is a clear need to be able to share information easily, but also securely and seemlessly throughout the organization.  Relatedly, a large overhead was being spent in maintaining and curating email lists for communication, while using Google’s gsuite tools (docs, gmail, classroom) to share information between volunteers, students, ec members and board members.

Although some organization members had minds matter gsuite accounts, others did not.  This meant there was an ad hoc system of sharing documents with volunteers personal gmail accounts as new volunteers entered roles.  A unified drive folder helped the EC mitigate this problem, but individual accounts still owned key documents.  This meant when a volunteer left a role, there was no systematic way to tranfer all of their key documents to another user.  A lot of time was being spent asking and answering where certain pieces of information were being held and how people could get access to them.  This represented a long term liability for the organization.

The board and EC evaluated a number of options, but ultimately decided that Gsuite services actually did fit the organization overall needs.  It would minimize the institutional disruption, as several of the services (drive, classroom, groups) were already being utilized by the org.  What was missing was a low effort way to organize and maintain the gsuite account.  If every Minds Matter community member had their own account, and a backend system could maintain membership in the organization and appropriate google groups, then permissions could be easily managed through the use of group sharing.  Furthermore, google sites could be utilized to provide an easy to edit Intranet site that could be shared privately with only the appropriate members of the org. 

In order to realize this vision, the core organizational capability that was missing in the ad-hoc solution was the guarantee that there was a single source of truth about who were the current set of volunteers, ec members, students and board members that was both actively maintained AND automatically synchronized with all the permissions and communication pathways.

Salesforce was the obvious choice for what this actively maintained source of truth should be, but there was not an obvious mechanism for translating changes in salesforce into changes in gsuite accounts and group permissions.  So we decided to develop a gsuite script plugin to facilitate synchronization between salesforce and our gsuite domain that would automate the creation of user accounts, and membership in the appropriate google groups.  With this core capability, intranet sites could be developed using embedded google drive documents that contained institutional knowledge and facts organized and laid out according to the ideas of non-technical members of the EC staff.  Students and volunteers can also now use their mindsmatterseattle gmail account to easily contact any member of the organization through directory sharing.

This document outlines the steps required to deploy this synchronization system and is meant to provide a roadmap for other Minds Matter chapters that might want to replicate what Minds Matter Seattle has done. 

# Deployment Steps
1. Setup a gsuite domain with an admin account, this is an account that will run the infrastructure, but is not tied to a particular individual in the organization, so that the system will keep working in the event that any individual leaves the org.
beyond the scope of these docs]
Enable directory sharing in the admin console. 
https://support.google.com/a/answer/60218?hl=en



2. Setup a Salesforce report that includes all the volunteers and students you want to have accounts.

Use the **Contacts and Engagement History** report type. 
Set Contacts = "All Contacts" and Anniversay Date = "All Time".

Set the filter logic to `(1 AND 2 AND 3) OR (1 AND 4 AND 5)` with these filters:

    1. Organization: Account Name  equals  Seattle Chapter
    2. Status                      equals  Current
    3. Engagement Type             equals  Board Member, College Program Student, Employee, High School Student, Volunteer
    4. Status                      equals  Former
    5. Engagement Type             equals  High School Student

This captures all current active members plus former High School Students (alumni).

It should have the following columns.

**Required by Code.js** (sync will break without these):

    First Name                  — used to construct the org email and create the account
    Last Name                   — used to construct the org email and create the account
    Engagement Type             - used to identify volunteers, board members, employees, high school students (or college students)
    Email                       — personal/home email to send new account information to 
    Phone                       — stored on the new account
    Status                      — Used to determine who is active, and to skip account creation for completed graduates
    Contact Record Type         — used by group membership filters
    Year                        — used by group membership filters (student cohort groups)
    Role (Non-Leadership)       — used by group membership filters (mentors, instructors)
    Student Year Association    — used by group membership filters (mentor-to-cohort matching)
    Leadership                  — used by group membership filters (board, EC)
    Leadership Sub-Role         — used by group membership filters (program directors, etc.)
    

**Required by update_contacts.js** (contact info sync back to Salesforce):

    Mailing Street
    Mailing City
    Mailing State/Province
    Mailing Zip/Postal Code
    Mobile
    Employer
    Title
    Contact ID                  — used to match the Google account to the Salesforce contact record

**Informational / not directly used by any script:**

    Full Name
    Affiliation Name
    Mailing Country
    Employer lookup: Account Name

4. Clean the salesforce data so it accurately reflects your chapters current volunteers and students including EC status, board status, instructor group status, etc. 


5. If you have existing gsuite accounts, normalize the data between them.
Add aliases for all existing users with pattern FirstName.LastName@mindsmatterXXX.org in order that the script recognizes that these salesforce entries have an account already.  Note Salesforce Data must match precisely.  Replace all spaces in First and Last names with “.” Later can use “dry run” variable to test what will happen before it does. 


6. Make sure there is a process for updating this information as students and volunteers enter and leave the organization.


7. Create a spreadsheet in your admin accounts gdrive.  We call ours “SEA Current Contacts” you will need the ID of the spreadsheet later (salesforceSpreadSheetID) 
We decided to give everyone in ec@ and board access to this spreadsheet.  So we modifies shared it with the group ec@ and  board@. This should automatically add and remove access to this information as users are added to and remove from these groups.
TODO: make this running a function. 

8. Install the “Data connector for salesforce” add-on from gdrive, use it to connect to your salesforce account, and pull the report into the sheet. 
https://gsuite.google.com/marketplace/app/data_connector_for_salesforce/857627895310
Note the name of the sheet’s tab (salesforceSheetName)


9. Use the auto-refresh option of Data Connector to setup automated pulling of this data.


10. Create a “User Creation” spreadsheet in gdrive in the admin account, with these columns

    First Name,mmemail,private-email,password

Note the ID of spreadsheet (newUserSheetID)
TODO: Make the generation of this spreadsheet automated

11. Create a “UserSuspension” spreadsheet owned by admin (note ID “userSuspensionSheetID”)

    Add a “SuspendedUsers” tab to spreadsheet.

    Add “Name” and “Email” columns 

    TODO: maybe make this spreadsheet follow the bulk user update format. To allow easier semi-automated user suspension.

    TODO: make the creation of this spreadsheet a function you can run


12. Install the script in your google code repo from development machine

    Clone the repository https://github.com/fcollman/MMSalesforceGsuite
   
    Install clasp on dev machine https://github.com/google/clasp
  
    Enable api usage on admin https://script.google.com/home/usersettings
   
    Cd to MMSalesforceGsuite
   
    clasp login
   
    Use admin credentials
  
    clasp create --title "SalesforceSync"
  
    clasp push
  
    Pushes current directory to script.google.com

    if you cannot do this step, you can fall back to copy/pasting code from github.com
    into files named the same thing within the script.google.com UI.

13. Setup variables at script.google.com
Open project on web browser
Hit file>project properties > script properties

    newUserSheetID = [note from above] 
    salesforceSpreadSheetID = [note from above]
    userSuspensionSheetID = [note from above]
    salesforceSheetName = [note from above]
    domainname = mindsmatterXXXX.org [your google domain]

TODO: make the spreadsheet creation and variable setting automated.

14. configure desired groups
    edit groups_conf.js to reflect the groups you want to have managed by the script.
    each configuration follows a format

    "GROUP_NAME":{
        "name": "the name of my group",
        "description": "the description of my group",
        "combination": "or" or "and" (controls whether all or any of the filters must be met),
        "filters":[
            one or more of these...
            {
                "column": "a column name from the salesforce report",
                "condition": "equals" or "contains" depending on whether you want to search or match,
                "value": "the value you are matching or searching for"
            }
        ]
        "do_remove": true or false, whether you want the script to actively remove members that don't meet these criteria
    }

    run setup_groups function to automatically create all the groups that have not yet been created.  If groups were created before, you may need to transfer ownership of that group to the admin account.

15. Do a dry run of user creation.
    Edit dry_run = false, to dry_run = true (~line 282) in script.
    Manually trigger script on script.google.com “run>run function>syncGoogleWithSalesforce”
    Wait ~5 minutes for 140 users (till tan box goes away) (more with more users)
    view> logs to see what would have happened.  Iterate on fixing data in salesforce till desired resullt is achieved.
    If satisfied, edit dry_run=true, and rerun.  Accounts should be created and group memberships.

    Fix missing group memberships, manually add appropriate volunteers to google classrooms if you are using this gsuite feature. Todo: make this automated and optional.


16. Create your intranet sites using sites.google.com
17. Grant editing permissions to site based upon group membership or individuals you desire.
Make visibility settings based upon organization wide permissions, or group membership.  We created different sites for “internal” (all of org), “ec” and “board”.
This can be done in parallel with the above steps by volunteers and staff that have gsuite accounts.  Making admin the owner of these sites however will ensure that permissions can be transferred over time.

18. Run a mail merge to notify new users of their accounts.
Write a draft email template in the admin account gmail page introducing new users to their account.  Below is our example 

```

    Hi {{First Name}},

    Your Minds Matter of Seattle account

    {{mmemail}}

    has been created for you. Your password is 

    {{password}}

    This account allows you to receive email, and login to a set of google gsuite resources to gain access to Minds Matter specific information.

    To access your account, go to www.gmail.com, and login with your email and password.  If you already have a google account, you may need to click in the upper right to "add an account".  Once you have successfully logged in, changed your password and passed two factor authentication, you should be able to use your computer to access the full suite of gsuite services.

    For example use it to login to the internal minds matter site (https://sites.google.com/mindsmatterseattle.org/internal).  It will also allow you to create and share google documents with students and volunteers.

    If you’d like to forward your minds matter email to a personal email you may do so by following these instructions https://support.google.com/mail/answer/10957?hl=en.

    If you have any problems accessing your account, please email admin@mindsmatterseattle.org.

    Best,
    Minds Matter Seattle Technology Team

```
19. Identify the ID of the draft email you saved...
open the gscript project. 
open MailMerge.gs
run>run function>getDraftId
view>Logs
note the ID after the : of the subject line
save this ID in the project properties:
file>project properties>Script properties.  Set newAccountDraftID = IDNOTEDABOVE

20. Test run_merge
    Add some data to the UserCreation spreadsheet
    run the run_merge function
    Those people should receive emails with the text filled in
    and the rows should be marked "done" 

21. Add special accounts you want to be protected, add them to a script property
    Name: protectedAccounts
    Value (example): admin,finance,marketing,seniorzoom,sophomorezoom,juniorzoom
    Test auditActive
    run the auditactive script
    check the suspendedUsers spreadsheet to see who would be marked for suspension
22. Setup triggers
    Go to script.google.com, select the project you created.
    click vertical dots on right hand side of screen, next to Project Details
    select Triggers
    click Add Trigger button (bottom right corner)

    Suggested triggers to add
    auditActive (every day)
    syncGoogleWithSalesforce_v2 (every 12 hours)
    run_merge (every 12 hours)

<!-- 
Install a mail merge add-on on your “User Creation” spreadsheet.  We use “Yet another Mail Merge”.  Run the add-on to email users.  Free version limited to emailing 50 people per day, $40/year to make it more than that. 
Prepare to deal with questions about logins and people losing login email or not receiving it due to types in email address, or not understanding how to add a gsuite account to their google login if they are using gmail for personal use. One helpful tip is that the admin console allows you to download a list of users and when they have last logged in.  We used this to setup a separate mail merge spreadsheet which emailed users at their personal logins if they hadn’t yet logged in.  I set this up by doing a merge between the login spreadsheet and the user creation spreadsheet in python. 

    TODO: make this capability easier to do.  We also used this to manually approach and assist volunteers and students who were not yet using the system.  We did have to utilize people’s personal emails for the first session as well because we did not have confidence that everyone was using and checking their new minds matter accounts. -->


TODOS
-----
See github issues...


Benevity Salesforce Ingestion
-----------------------------
To make this work you need to setup a env.sh file in this repo directory with your salesforce credentials

::

    export SALESFORCE_PASSWORD=put_your_password_here
    export SALESFORCE_EMAIL=yourlogin@atmindsmatterchapter.org

You go to benevity and download a set of csv reports and place them in a directory.

create a python environment with all the pre-reqs in requirements.txt installed plus jupyter hub or lab.

launch a jupyter notebook server and open the benevity_salesforce_import_Mar2023.ipynb notebook

This process is semi-automated and will require some interactive components.

For example, you  need to set the security_token variable to a two factor authentication code and execute the login cell while it is still valid to get a session_id, this should be good for several hours to let you get your work done.

Second, you need to specify the directory in 

::

    report_files = glob.glob('../DonationReports3/*.csv')

to be the directory where you downloaded all the benevity csvs.

You may encounter an error message as you execute the ingestion code that suggests that a company account cannot be found.  This might be because Salesforce does not have an account for that company, or it might be that it has an account, but it is just under a different name.  The dictionary salesforce_cleaning is meant to help you remap names as they appear in Benevity to the name of the account in Salesforce.  You can add to this dictionary to help you do the remapping.  You might also need to create a new "Account" in salesforce to represent the company so we can track the donations/matches that come from them.

The script will try to match individuals based on First Name and Last Name, and then if nothing is found it will match on email.  If it matches on neither it will automatically create new accounts under the First Name,Last Names and emails which appear in the report.  It is of course possible that these people do in fact exist in Salesforce underneath a different name and email, and this will fracture their donations.  Adjusting their salesforce emails to match whatever email exists in Benevity is probably the easiest way to fix this data, but often it will be a work email which might be different that what you want in salesforce.

Often the script will error out when a bunch of donations are done in short succession, particularly if they are hitting the same account, such as Anonymous.  Restarting the import cell shown below

::

    # a set of company renames that are necessary to map fields between Salesforce and Benevity systems.
    for report_file in report_files[0:]:
        print(report_file)
        report_df = pd.read_csv(report_file, skiprows=11, skipfooter=4,thousands=',')
        report_df['Company']=report_df.Company.replace(salesforce_cleaning)
        process_report(report_df)

As reports are fully processed, you can increment the zero number forward to avoid reprocessing files. Note it will check salesforce to make sure that rows that are processed are not processed a second time and show that has skipped them, so restarting from the beginning doesn't hurt anything but just takes longer. 

