/**
 * Sends a single mail-merge email for one spreadsheet row.
 * Fills in the template subject, HTML body, and plain-text body from rowData,
 * then sends via GmailApp. Also propagates cc/bcc if present in rowData.
 *
 * @param {Object} rowData - Object of column-name → cell-value pairs for this row.
 * @param {Object} mergeData - Merge configuration containing template, subject, plainText,
 *   attachments, inlineImages, name, from, cc, and bcc fields.
 * @param {string} emailcol - Property name in rowData holding the recipient email address.
 */
function processRow(rowData, mergeData, emailcol) {
    var emailText = fillInTemplateFromObject(mergeData.template, rowData);
    var emailSubject = fillInTemplateFromObject(mergeData.subject, rowData);
    var plainTextBody = fillInTemplateFromObject(mergeData.plainText, rowData);
    mergeData['htmlBody'] = emailText;
    if (rowData.cc != undefined) mergeData.cc = rowData.cc;
    if (rowData.bcc != undefined) mergeData.bcc = rowData.bcc;
    console.log(rowData)
    GmailApp.sendEmail(rowData[emailcol], emailSubject, plainTextBody, mergeData);
}
/**
 * Logs the ID and subject of every Gmail draft to the console.
 * Useful for finding the draft ID needed by run_mail_merge().
 */
function getDraftId() {
    var drafts = GmailApp.getDrafts();
    for (var i = 0; i < drafts.length; i++) {
        console.log(drafts[i].getId());
        console.log(drafts[i].getMessage().getSubject());
    }
}

/**
 * Runs a mail merge using a Gmail draft as the template and a Google Sheet as the data source.
 * For each row where "Merge status" is blank, sends the email and marks the cell "Done".
 * Rows that error are marked "Error" with a red background and the error message as a comment.
 * Inline images embedded in the draft are preserved in the sent emails.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - Spreadsheet containing recipient data.
 * @param {string} draftID - Gmail draft ID to use as the email template.
 * @param {string} tocolumn - Normalized column name (from utils.js normalizeHeader) holding
 *   the recipient email address.
 */
function run_mail_merge(ss, draftID, tocolumn) {
    var name = "Minds Matter"
    var domainname = PropertiesService.getScriptProperties().getProperty('domainname');
    var from = 'admin@' + domainname;
    var selectedDraft = GmailApp.getDraft(draftID)
    var selectedTemplate = selectedDraft.getMessage()
    var dataSheet = ss.getActiveSheet();
    var headers = createHeaderIfNotFound_('Merge status', ss);
    var dataRange = dataSheet.getDataRange();
    //////////////////////////////////////////////////////////////////////////////
    // Get inline images and make sure they stay as inline images
    //////////////////////////////////////////////////////////////////////////////
    var emailTemplate = selectedTemplate.getBody();
    var rawContent = selectedTemplate.getRawContent();
    var attachments = selectedTemplate.getAttachments();
    var cc = selectedTemplate.getCc();
    var bcc = selectedTemplate.getBcc();

    var regMessageId = new RegExp(selectedTemplate.getId(), "g");
    if (emailTemplate.match(regMessageId) != null) {
        var inlineImages = {};
        var nbrOfImg = emailTemplate.match(regMessageId).length;
        var imgVars = emailTemplate.match(/<img[^>]+>/g);
        var imgToReplace = [];
        if (imgVars != null) {
            for (var i = 0; i < imgVars.length; i++) {
                if (imgVars[i].search(regMessageId) != -1) {
                    var id = imgVars[i].match(/realattid=([^&]+)&/);
                    if (id != null) {
                        id = id[1];
                        var temp = rawContent.split(id)[1];
                        temp = temp.substr(temp.lastIndexOf('Content-Type'));
                        var imgTitle = temp.match(/name="([^"]+)"/);
                        var contentType = temp.match(/Content-Type: ([^;]+);/);
                        contentType = (contentType != null) ? contentType[1] : "image/jpeg";
                        var b64c1 = rawContent.lastIndexOf(id) + id.length + 3; // first character in image base64
                        var b64cn = rawContent.substr(b64c1).indexOf("--") - 3; // last character in image base64
                        var imgb64 = rawContent.substring(b64c1, b64c1 + b64cn + 1); // is this fragile or safe enough?
                        var imgblob = Utilities.newBlob(Utilities.base64Decode(imgb64), contentType, id); // decode and blob
                        if (imgTitle != null) imgToReplace.push([imgTitle[1], imgVars[i], id, imgblob]);
                    }
                }
            }
        }
        for (var i = 0; i < imgToReplace.length; i++) {
            inlineImages[imgToReplace[i][2]] = imgToReplace[i][3];
            var newImg = imgToReplace[i][1].replace(/src="[^\"]+\"/, "src=\"cid:" + imgToReplace[i][2] + "\"");
            emailTemplate = emailTemplate.replace(imgToReplace[i][1], newImg);
        }
    }
    //////////////////////////////////////////////////////////////////////////////
    var mergeData = {
        template: emailTemplate,
        subject: selectedTemplate.getSubject(),
        plainText: selectedTemplate.getPlainBody(),
        attachments: attachments,
        name: name,
        from: from,
        cc: cc,
        bcc: bcc,
        inlineImages: inlineImages
    }

    var objects = getRowsData(dataSheet, dataRange);
    console.log(objects);
    for (var i = 0; i < objects.length; ++i) {
        var rowData = objects[i];
        if (rowData.mergeStatus == "") {
            try {
                processRow(rowData, mergeData, tocolumn);
                dataSheet.getRange(i + 2, headers.indexOf('Merge status') + 1).setValue("Done").clearFormat().setComment(new Date());
            }
            catch (e) {
                dataSheet.getRange(i + 2, headers.indexOf('Merge status') + 1).setValue("Error").setBackground('red').setComment(e.message);
            }
        }
    }
}

/**
 * Convenience wrapper that runs a mail merge for new-account welcome emails.
 * Reads the draft ID from script property 'newAccountDraftID' and sends to the
 * 'privateemail' column of the new-user tracking sheet ('newUserSheetID').
 */
function run_merge() {
    var draftID = PropertiesService.getScriptProperties().getProperty('newAccountDraftID');
    var userID = PropertiesService.getScriptProperties().getProperty('newUserSheetID');
    var ss = SpreadsheetApp.openById(userID);
    run_mail_merge(ss, draftID, 'privateemail');
}

// Replaces markers in a template string with values define in a JavaScript data object.
// Arguments:
//   - template: string containing markers, for instance <<Column name>>
//   - data: JavaScript object with values to that will replace markers. For instance
//           data.columnName will replace marker <<Column name>>
// Returns a string without markers. If no data is found to replace a marker, it is
// simply removed.
function fillInTemplateFromObject(template, data) {
    template = template.replace(/&lt;&lt;/g, '<<');
    template = template.replace(/&gt;&gt;/g, '>>');
    template = template.replace(/\{\{/g, '<<');
    template = template.replace(/\}\}/g, '>>');
    var email = template;
    console.log(template)
    template = template.replace(/">/g, "~");
    // Search for all the variables to be replaced, for instance <<Column name>>
    var templateVars = template.match(/<<[^\>]+>>/g);
    if (templateVars != null) {
        if (template.match(/\$\%[^\%]+\%/g) != null) {
            templateVars = templateVars.concat(template.match(/\$\%[^\%]+\%/g));
        }
    }
    else {
        var templateVars = template.match(/\$\%[^\%]+\%/g);
    }
    console.log(templateVars)
    if (templateVars != null) {
        // Replace variables from the template with the actual values from the data object.
        // If no value is available, replace with the empty string.
        for (var i = 0; i < templateVars.length; ++i) {
            // normalizeHeader ignores <<>> so we can call it directly here.
            var variableData = data[normalizeHeader(templateVars[i].replace(/<[^\~]+~/, ''))];
            variableData = variableData.replace(/\r?\n/g, "<br />")
            templateVars[i] = templateVars[i].replace(/~/g, '">');
            // Check that we have a header for this merge field
            if (variableData == undefined) {
                throw new UserException("Undefined merge field " + templateVars[i]);
            }
            email = email.replace(templateVars[i], variableData || "");
        }
    }
    return email;
}