<html>
<head>
<script type="text/javascript" src="http://code.jquery.com/jquery-1.6.4.js"></script>
<script type="text/javascript">
$(document).ready(function() {
    var domainname = 'http://naynweb.16mb.com/moodle';
    var token = '7c04cafbadfa16d5eeb9444e512a56d5';
    var functionname = 'mod_assign_save_grade';

    var serverurl = domainname + '/webservice/rest/server.php' ;
    //add params into data
    var assignmentid = 2;
    var userid = 9;
    var grade = 100;
    var attemptnumber = -1;
    var addattemp = 0;
    var workflowstate ="graded";
    var applytoall = 0;           
    var data = {
                "wstoken": token,
                "wsfunction": functionname,
                "moodlewsrestformat": 'json',
                "assignmentid":assignmentid,
                "userid": userid,
                "grade": grade,
                "attemptnumber": attemptnumber,
                "addattempt": addattemp,
                "workflowstate": workflowstate,
                "applytoall": applytoall,
                "plugindata[assignfeedbackcomments_editor][text]": "",
                "plugindata[assignfeedbackcomments_editor][format]":0,
                "plugindata[files_filemanager]": 0

                }
    var response = $.ajax(
                            {   type: 'POST',
                                data: data,
                                url: serverurl
                            }
                         );
    console.log(response);
});
</script>
</head>
<body>
    Check your Javascript console for the "responseText" value.
</body>
</html>