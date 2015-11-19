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
            temario: {type: "model"}
        },

        routes: [
            ["temario/:courseId", "temario", "mostrarTemario"]
        ],

        mostrarTemario: function(courseId){
            MM.log("Mostrando temario");
            $.mobile.loading( 'show', {
                text: 'Cargando',
                textVisible: true,
                theme: 'b'
            });

            var data = {
                "curso": courseId
            };

            MM.moodleWSCall('local_mobile_hello_world', data, function(tem){
                 $.mobile.hidePageLoadingMsg();
                 MM.log("Mostrando local_mobile");
                    var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
                    var nombres =[];
                    var summary = [];
                    var pageTitle = "Temario de " + course.get("fullname");
                    console.info(tem);
                    MM.log("Mostrando local_mobile2");
                    for (var i = 0; i < tem.length; i++) {
                        MM.log("Mostrando for");
                        if (tem[i]['nombre'] != null){
                            //nombres += tem[i]['nombre'] ;
                            nombres.push(tem[i]['nombre']);
                            console.info(tem[i]['nombre']);
                        }
                        if (tem[i]['summary'] != ""){
                            MM.log("Mostrando segundo if");
                           // summary += '&nbsp;' +tem[i]['summary'];
                           summary.push(tem[i]['summary']);
                            console.info(tem[i]['summary']);
                        }
                        MM.log("termino if");
                      
                         MM.log("Mostrando local_mobile3");
                    };
                    var variables = {datos: tem, deviceType: MM.deviceType, titulo: pageTitle, curso: courseId, tema: nombres, subtemas: summary};
                    var output = MM.tpl.render(MM.plugins.temario.templates.temario.html, variables);
                    MM.ocultarMenu();
                    $('#principal').html(output).trigger("create");
                   
                });
            },

        


        templates: {
            "temario":{
                html: temarioTpl
            }
        }
    }

    MM.registrarPlugin(plugin);
})