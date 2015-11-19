var templates = [
    "root/externallib/text!root/plugins/temario/temario.html"
];

define(templates, function(temarioTpl){
    var plugin = {
        settings: {
            name: "temario",
            nameToShow: "Temario",
            type: "course",
            menuURL: "#temario/",
            lang: {
                component: "core"
            },
            icon: ""
        },

        storage: {
            temario: {type: "model"},
            temarios: {type: "collection", model: "temario"}
        },

        routes: [
            ["calificaciones/:courseId/:userId", "calificaciones", "mostrartemario"]
        ],



        mostrarcalificaciones: function(courseId, userId){

            var data = {
                "userlist[0][userid]": userId,
                "userlist[0][courseid]": courseId
            }

            MM.log("Mostrando calificaciones");

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
                var output = MM.tpl.render(MM.plugins.temarios.templates.temario.html, variables);


            });


        },

        templates: {
            "temario":{
                model: "temario",
                html: temarioTpl
            }
        }
    }

    MM.registrarPlugin(plugin);
})