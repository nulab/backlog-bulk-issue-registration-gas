# Backlog bulk issue registration via Google Sheets

This is a tool to bulk register issues with Backlog using Google Docs (Spreadsheet).

It can for instance be used in the following cases: 

* When you need to register fixed issues when starting a new project.
* When you have to register the same tasks on a regular basis, e.g. operation or maintenance tasks.

Please read the entire document before you start working on the bulk registration.

## Installation

First you need to prepare the spreadsheet template. Please follow the link below and copy the spreadsheet.
* <a href="https://docs.google.com/spreadsheets/d/1RS9c1yNev7pCzxFyncuYcJDP6pjQSDQNEfCgsA7Exbw/copy" target="_blank">Copy spreadsheet (please open in new tab)</a>
* If you are not logged into Google, you may get an error when trying to copy the document. If that happens, please login into Google using your Google account and try again.

## About the input cells

Based on the template, you can rewrite the contents of the spreadsheet with the information you wish to register. Please note however that the header of the document contains information necessary for registration processes, so do not delete or edit its contents, or the registration will not work. Also not that both "Subject" and "Issue Type" are necessary for registration, so both those cells needs to be filled in for every issue(row).

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/about.png">

### Parent issue
If you wish to specify a parent issue that is already registered with Backlog, please enter its `issue key`. If you wish to specify an issue within the spreadsheet as a parent issue, `*` can be entered. That will set the previous issue that does not have a parent issue, as the parent issue. 

![](https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/parent_issue.png)

### Custom field
If custom fields are used in the project that is to be the target for the bulk issue registration, these custom fields will be added as light blue columns when executing STEP1, which will be described later.

* Multiple selection custom fields are not added.
* Custom fields can be with Premium Plan or higher plans.

## Execution

After opening the spreadsheet a menu item called "Backlog" will be added to the far right in the spreadsheet menu bar. Please not however that it takes about 10 seconds for the menu item to appear.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/menu.png" width="544" height="74">

Execution is done in two steps. Please follow the order described below, beginning with STEP 1.
An Autheroization approval screen may appear during the exectution, if that happens please press the "button in the red frame" as shown in the two pictures below, and you will be able to proceed with the the bulk registration execution.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/auth_require.png" width="350" height="137">

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/auth.png" width="356" height="408">



### STEP 1: Acquire data from Backlog
In STEP 1, we fetch data definitions (issue type name, user name etc.) from Backlog.

Click [STEP 1: Acquire data from Backlog] from the [Backlog] menu.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/menu_step1.png" width="293" height="106">

The following input dialog will be shown. Enter the necessary information so that the data can be fetched

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/form_step1.png" width="369" height="221">

* Space ID of your Backlog
* Backlog API key: https://support.backlog.com/hc/en-us/articles/115015420567-API-Settings
* Project key of the Backlog project that issues will be registered to

After entering all necessary information, click on the 'Execute' button to fetch the data from Backlog.
Upon successful execution, a completion popup will appear in the lower right.

Please confirm that you can select the necessary fetched information such as task type and category.

### Fill in the issues in the spreadsheet

Please enter the issues you want to register with Backlog in your spreadsheet.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/about.png">


### STEP 2: Execute bulk registration processing
By executing STEP 2, the issues you have entered in the spreadsheet will be bulk registered with Backlog. 

From the [Backlog] menu, click [STEP 2: Execute bulk issue registration].

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/menu_step2.png" width="293" height="106">

The following input dialog will be shown again, but since it has already been entered in `STEP 1`, the data is still there, so you can just click on the 'Execute' button and execute the bulk registration process will begin.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/form_step2.png" width="367" height="218">

When the bulk registration process is completed, you are automatically transitioned to a newly created sheet. In this sheet you can, using the issue key and subject, confirm the issues that was created during the bulk registration.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/log_sheet.png" width="445" height="208">

If you open the issue list in Backlog, you can see the newly registered issues.

![](https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/en/result.png)

## Reusing a spreadsheet

If there are no changes in Backlogs data (e.g. issue type name, user name) you can start from STEP 2.
If you however have added or updated your data in Backlog and need to update the data in the spreadsheet based on the data in Backlog, please start from STEP 1 again.

Custom fields are not automatically added and updated. If a custom field's name or type has been changed, remove **all** custom field columns and redo the execution from STEP1.

## Limitations

If access control with IP address restriction is used in Backlog, this tool can not be used.