var templates = [
    "root/externallib/text!root/plugins/calificaciones/participantes.html",
    "root/externallib/text!root/plugins/calificaciones/tableGrades.html"
];
define(templates, function(participantesTpl, tableGradesTpl){
    var plugin = {
        settings: {
            name: "calificaciones",
            nameToShow: "Calificaciones",
            type: "course",
            menuURL: "#calificaciones/",
            lang: {
                component: "core"
            },
            icon: ""
        },

        storage: {
            calificacion: {type: "model"},
            calificaciones: {type: "collection", model: "calificacion"}
        },

        routes: [
            ["calificaciones/:courseId", "participantes", "calificaciones"],
            ["calificaciones/:courseid/:userid", "viewGrades", "viewGrades"]
        ],

        calificaciones: function(courseId){
            var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
            var idThisUser = MM.config.current_site.userid;
            if (course.get("teacher") == idThisUser ) {
                             console.log("Es maestro");
                              MM.plugins.calificaciones.mostrarParticipantes(courseId);
                        }
            else
            {
             MM.plugins.calificaciones.viewGrades(courseId,idThisUser);
            }
        },

        mostrarParticipantes: function(courseId){
            MM.log("Mostrando participantes");
            $.mobile.loading( 'show', {
                text: 'Cargando',
                textVisible: true,
                theme: 'b'
            });

            var data = {
                "courseid": courseId
            };

            MM.moodleWSCall('core_enrol_get_enrolled_users', data, function(users){
                $.mobile.hidePageLoadingMsg();
                //cargamos el template
                var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
                //var plugins = MM.db.get("plugins",MM.config.current_site.id+"-"+courseId);
                console.log("ALUMNOS INCRITOS");
                console.log(users);
                var pageTitle = "P de " + course.get("fullname");
                
                var plugins =  [];
                var coursePlugins =  [];

                MM.log("MM.config.plugins: " + MM.config.plugins);
                
                var variables = {usuarios: users, deviceType: MM.deviceType, courseId: courseId, titulo: pageTitle, courses: MM.coursePlugins};
                var output = MM.tpl.render(MM.plugins.calificaciones.templates.participantes.html, variables);
                MM.ocultarMenu();
                $('#principal').html(output).trigger("create");

                //ocultamos el menu
                //MM.ocultarMenu();
               // MM.ocultarPrincipal();

                
            }, null, function(m){
                MM.log("Error participantes");
                $.mobile.hidePageLoadingMsg();
            });
        },
        viewGrades: function(courseId, userId){

            var data = {
                "courseid" : courseId,
                "userid"   : userId
            };
             MM.moodleWSCall('local_mobile_gradereport_user_get_grades_table', data, function(result){
                console.log(result);
                var tpl = {
                    table: MM.plugins.calificaciones._createTable(result),
                    courseid: courseId
                };
                console.log(tpl);
                var html = MM.tpl.render(MM.plugins.calificaciones.templates.tableGrades.html,tpl);
                $('#principal').html(html).trigger("create");


                     },
                      null,
                      function (error) {
                        console.log(error);
                        });

            

        },
        _createTable: function(table) {
            if (!table || !table.tables) {
                return "";
            }
            console.log(table);

            // Columns, by order.
            var columns = ["itemname", "weight","grade","range","percentage","lettergrade","rank","average","feedback", "contributiontocoursetotal"];
            var returnedColumns = [];

            var tabledata = [];
            var maxDepth = 0;
            // Check columns returned (maybe some of the above).
            if (table.tables && table.tables[0] && table.tables[0]['tabledata']) {
                tabledata = table.tables[0]['tabledata'];
                maxDepth = table.tables[0]['maxdepth'];
                for (var el in tabledata) {
                    // This is a typical row.
                    if (typeof tabledata[el]["leader"] == "undefined") {
                        for (var col in tabledata[el]) {
                            returnedColumns.push(col);
                        }
                        break;
                    }
                }
            }

            var html = "";

            var returnedColumnsLenght = returnedColumns.length;

            if (returnedColumnsLenght > 0) {

                // Reduce the returned columns for phone version.
                if (MM.deviceType == "phone") {
                    returnedColumns = ["itemname", "grade","feedback"];
                }

                html = '<table cellspacing="0" cellpadding="0" class="user-grade boxaligncenter generaltable user-grade">';
                html += '<thead>';

                var colName, extra;

                for (var el in columns) {
                    extra = "";
                    colName = columns[el];

                    if (returnedColumns.indexOf(colName) > -1) {
                        if (colName == "itemname") {
                            extra = ' colspan="' + maxDepth + '" ';
                        }
                        html += '<th id="' + colName + '" class="header" '+extra+'>' + MM.lang.s(colName) + '</th>';
                    }
                }

                html += '</thead><tbody>';

                var name, rowspan, tclass, colspan, content, celltype, id, headers,j, img, colspanVal;

                var len = tabledata.length;
                for (var i = 0; i < len; i++) {
                    html += "<tr>\n";
                    if (typeof(tabledata[i]['leader']) != "undefined") {
                        rowspan = tabledata[i]['leader']['rowspan'];
                        tclass = tabledata[i]['leader']['class'];
                        html += '<td  class="' + tclass + '" rowspan="' + rowspan + '"></td>' + "\n";
                    }
                    for (el in returnedColumns) {
                        name = returnedColumns[el];

                        if (typeof(tabledata[i][name]) != "undefined") {
                            tclass = (typeof(tabledata[i][name]['class']) != "undefined")? tabledata[i][name]['class'] : '';
                            colspan = (typeof(tabledata[i][name]['colspan']) != "undefined")? "colspan='"+tabledata[i][name]['colspan']+"'" : '';
                            content = (typeof(tabledata[i][name]['content']) != "undefined")? tabledata[i][name]['content'] : null;
                            celltype = (typeof(tabledata[i][name]['celltype']) != "undefined")? tabledata[i][name]['celltype'] : 'td';
                            id = (typeof(tabledata[i][name]['id']) != "undefined")? "id='" + tabledata[i][name]['id'] +"'" : '';
                            headers = (typeof(tabledata[i][name]['headers']) != "undefined")? "headers='" + tabledata[i][name]['headers'] + "'" : '';

                            if (typeof(content) != "undefined") {
                                img = MM.plugins.calificaciones._findImage(content);
                                content = content.replace(/<\/span>/gi, "\n");
                                content = MM.util.cleanTags(content);
                                content = content.replace("\n", "<br />");
                                content = img + " " + content;

                                html += "<" + celltype + " " + id + " " + headers + " " + "class='"+ tclass +"' " + colspan +">";
                                html += content;
                                html += "</" + celltype + ">\n";
                            }
                        }
                    }
                    html += "</tr>\n";
                }

                html += '</tbody></table>';
            }

            return html;
        },
        _findImage: function(text) {
            var img = "";

            if (text.indexOf("/agg_mean") > -1) {
                img = '<img src="img/grades/agg_mean.png" width="16">';
            } else if (text.indexOf("/agg_sum") > -1) {
                img = '<img src="img/grades/agg_sum.png" width="16">';
            } else if (text.indexOf("/outcomes") > -1) {
                img = '<img src="img/grades/outcomes.png" width="16">';
            } else if (text.indexOf("i/folder") > -1) {
                img = '<img src="img/folder.png" width="16">';
            } else if (text.indexOf("/manual_item") > -1) {
                img = '<img src="img/grades/manual_item.png" width="16">';
            } else if (text.indexOf("/mod/") > -1) {
                var module = text.match(/mod\/([^\/]*)\//);
                if (typeof module[1] != "undefined") {
                    img = '<img src="img/mod/' + module[1] + '.png" width="16">';
                }
            }
            if (img) {
                img = '<span class="app-ico">' + img + '</span>';
            }
            return img;
        },
        _loadParticipants: function(courseId, limitFrom, limitNumber, successCallback, errorCallback) {
            var data = {
                "courseid" : courseId,
                "options[0][name]" : "limitfrom",
                "options[0][value]": limitFrom,
                "options[1][name]" : "limitnumber",
                "options[1][value]": limitNumber,
            };

            MM.moodleWSCall(
                'moodle_user_get_users_by_courseid',
                data,
                function(users) {
                    successCallback(users);
                },
                {
                    logging: {
                        method: 'core_user_view_user_list',
                        data: {
                            courseid: courseId
                        }
                    }
                },
                function(m) {
                    errorCallback(m);
                }
            );
        },


        templates: {
            "participantes":{
                html: participantesTpl
            },
            "tableGrades":{
                html: tableGradesTpl
            }
        }
    }

    MM.registrarPlugin(plugin);
})