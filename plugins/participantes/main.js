var templates = [
    "root/externallib/text!root/plugins/participantes/participantes.html",
    "root/externallib/text!root/plugins/participantes/participante.html"
];

define(templates, function(participantesTpl, participanteTpl){
    var plugin = {
        settings: {
            name: "participantes",
            nameToShow: "Participantes",
            type: "course",
            menuURL: "#participantes/",
            lang: {
                component: "core"
            },
            icon: ""
        },

        storage: {
            participante: {type: "model"},
            participantes: {type: "collection", model: "participante"}
        },

        routes: [
            ["participantes/:courseId", "participantes", "mostrarParticipantes"],
            ["participante/:courseId/:userId", "participantes", "mostrarParticipante"]
        ],

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
                var pageTitle = "Participantes de " + course.get("fullname");
                
                var plugins =  [];
                var coursePlugins =  [];

                MM.log("MM.config.plugins: " + MM.config.plugins);
                
                var variables = {usuarios: users, deviceType: MM.deviceType, courseId: courseId, titulo: pageTitle, courses: MM.coursePlugins};
                var output = MM.tpl.render(MM.plugins.participantes.templates.participantes.html, variables);
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

        mostrarParticipante: function(courseId, userId){

            var data = {
                "userlist[0][userid]": userId,
                "userlist[0][courseid]": courseId
            }

            MM.log("Mostrando participante");

            MM.moodleWSCall('core_user_get_course_user_profiles', data, function(users){
                //cargar los plugins de tipo usuario
                var userPlugins = [];
                for (var el in MM.plugins){
                    var plugin = MM.plugins[el];
                    if (plugin.settings.type == "user"){
                        userPlugins.push(plugin.settings);
                    }
                }

                var newUser = users.shift();



                //Cargamos el template
                var variables = {usuario: newUser}
                var output = MM.tpl.render(MM.plugins.participantes.templates.participante.html, variables);


            });


        },

        templates: {
            "participante":{
                model: "participante",
                html: participanteTpl
            },
            "participantes":{
                html: participantesTpl
            }
        }
    }

    MM.registrarPlugin(plugin);
})