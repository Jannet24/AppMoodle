var MM = {

    config: {},
    plugins: [],
    models: {},
    collections: {},
    deviceType: 'phone',
    clickType: 'click',
    quickClick: 'click',
    deviceReady: false,
    deviceOS: '',
    logData: [],
    inComputer: false,
    touchMoving: false,
    scrollType: '',
    mq: 'only scren and (min-width: 768px) and (-webkit-min-device-pixel-ratio: 1)',

    init: function(config){
        //Configuraciones del config.js
        this.config = config;

        MM.log('Inicializando aplicacion');

        //Detección de sistema operativo
        this.deviceOS = (navigator.userAgent.match(/iPad/i)) == 'iPad' ? 'ios' : (navigator.userAgent.match(/iPhone/i)) == 'iPhone' ? 'ios' : (navigator.userAgent.match(/Android/i)) == 'Android' ? 'android' : 'null';

        MM.inComputer = navigator.userAgent.indexOf('Chrome') >= 0 ||
                        navigator.userAgent.indexOf('Safari') >= 0 ||
                        navigator.userAgent.indexOf('MSIE') >= 0 ||
                        navigator.userAgent.indexOf('Firefox') >= 0;
        MM.inComputer = MM.inComputer && navigator.userAgent.indexOf('Mobile') == -1;
        //Comprobar deviceOs
        MM.inComputer = MM.deviceOS != "ios" && MM.deviceOS != "android";
        //Comprobar si el Phonegap Javascript es cargado
        MM.inComputer = MM.inComputer && typeof(window.device) == "undefined";
        MM.inComputer = MM.inComputer && !MM.deviceReady;

        MM.webApp = location.href.indexOf('http') == 0;

        //Si estamos probandolo en una computadora, cargamos el Cordova emulando javascript, esperamos unos segudos
        //Si mientras tranto Phonegap es cargado, el loadEmulator no hara nada
        if(MM.inComputer || MM.webApp){
            setTimeout(function(){
                MM.log('MM: Cargando emulador Cordova, estamos en un: ' + navigator.userAgent);
            }, 5000);
        }

        // Cargar Backbone.Router para mapear url
        var appRouter = Backbone.Router.extend();
        this.Router = new appRouter;


        //cargar modelos
        //elementos para el core storage model
        var storage = {
            setting: {type: 'model', bbpropierties: {initialize: function() {MM.config[this.get('name')] =  this.get('value'); }}},
            settings: {type: 'collection', model: 'setting'},
            site: {type:'model'},
            sites: {type: 'collection', model: 'site'},
            course: {type:'model'},
            courses: {type: 'collection', model: 'course'},
            user: {type:'model'},
            users: {type: 'collection', model: 'user'}
        };
        this.cargarModelos(storage);

        //cargar rutas del nucleo
        this.cargarRutas();

        /* Load settings from database.
        MM.db.each('settings', function(e) {
            MM.config[e.get('name')] = e.get('value');
        });*/
    },

    loadLayout: function(){
        MM.log('Cargando vistas');
        var tpl = MM.tpl.render($('#login_template').html());
        $('#login').html(tpl).trigger("create");


        // DOM is ready!
        Backbone.history.start();

        // Agregar eventos
        //$('#login form #boton_login').on('click', this.validacion);
        $('#login form').on('submit', this.validacion);
    },

    loadSite: function(siteId){
        MM.log('Cargando sitio');
        var site = MM.db.get('sites', siteId);

        if(MM.config.current_site.id != site.id){
            MM.setConfig('current_site', site.toJSON());
        }

        MM.setConfig('current_token', site.get('token'));

        //Cosas de lenguaje
        //MM.lang.setup();
       

        for(var el in MM.config.plugins){
            var index = MM.config.plugins[el];
            var plugin = MM.plugins[index];
            if(typeof plugin == 'undefined'){
                continue;
            }
            /*if(plugin.settings.lang.component != "core"){    <-----------------***************
                MM.lang.setup(plugin.settings.name);
            }*/
        }

        //Algunas especificaciones para los SO
        if(MM.deviceOS == 'ios'){
            //Para ios, mejor usar trancisiones CSS3 (aceleracion de hardware)
            MM.setConfig('dev_css3transitions', true);
        }

        //Llamamos al WebService para obtener datos
        MM.moodleWSCall('core_enrol_get_users_courses', {userid: site.get('userid')}, function(courses) {

            var plugins =  [];
            var coursePlugins =  [];

            MM.log("MM.config.plugins: " + MM.config.plugins);

            for(var el in MM.config.plugins){

                var index =  MM.config.plugins[el];
                var plugin = MM.plugins[index];
                if (typeof plugin == 'undefined'){
                     MM.log("INDEX: es undefined "  );
                    continue;
                }
                if(plugin.settings.type == 'general'){
                    MM.log("INDEX: es general "  );
                    plugins.push(plugin.settings);
                } else if(plugin.settings.type == 'course'){
                     MM.log("INDEX: es course "  );
                    coursePlugins.push(plugin.settings);
                }
            }
            //Preparar informacion para cargar menu
            values = {
                usuario: {nombre: site.get('fullname'), avatar: site.get('userpictureurl')},
                siteurl: site.get('siteurl'),
                coursePlugins: coursePlugins,
                courses: courses,
                plugins: plugins
            };

            //cargar el template principal
            //var output = MM.tpl.render($('#contenido_template').html(), values);
            


            var outputMenu = MM.tpl.render($('#menu_template').html(), values);


           //var output = MM.tpl.render($('#calendario_template').html(), values);
        


            //Ocutar el sitio de login
            $('#login').css('display', 'none');
            
            //mostrar el template principal
            //$('#principal #panel-der').html(output).trigger("create");
            $('#cabezera').html(outputMenu).trigger("create");
            //$('#principal #panel-der').html(output).trigger("create");
            MM.calendario();        
            $('#contenido').css('display', 'block');


            //Almacenamiento del curso
            for (var el in courses){
                // Clonamos el objeto curso porque vamos a modificiarlo en una copia
                var storedCourse = JSON.parse(JSON.stringify(courses[el]));
                storedCourse.courseid = storedCourse.id;
                // Para evitar colisiones entre sitios
                storedCourse.id = MM.config.current_site.id + '-' + storedCourse.courseid;
                var r = MM.db.insert('courses', storedCourse);
            }


        }, {omitExpires: true}, function(){
            // Error inesperado. Mostramos la pagina principal
            $('#login').css('display', 'block');
        });

    },


    validacion: function(e){
        MM.log("Agregaremos un sitio");

        e.preventDefault();

        var siteurl = "http://naynweb.16mb.com/moodle";
        var username = $.trim($('#username').val());
        var password = $.trim($('#password').val());

        var stop = false;
        var msg = 'Login: ';

        if(stop){
            MM.log(msg);
            alert(msg);
            return;
        }
        else{
            MM.log(msg);
            //alert(msg);
            $.mobile.loading( 'show', {
                text: 'Conectando',
                textVisible: true,
                theme: 'b'
            });
        }

        MM.login(username, password, siteurl);
    },

    login: function(username, password, siteurl){
        var loginURL = siteurl + '/login/token.php';

        MM.log("Login: intentando conectar");

        // Ahora intentaremos conseguir un token valido
        $.ajax(
            {
                url:loginURL,
                type: 'POST',
                data: {
                    username: username,
                    password: password,
                    service: MM.config.wsservice
                },
                dataType: "json",
                success:
                    function(json){
                        if (typeof(json.token) != 'undefined' ){
                            var mytoken = json.token;

                            MM.setConfig('current_token', mytoken);

                            var preSets = {
                                wstoken: mytoken,
                                siteurl: siteurl,
                                silently: true,
                                cache: 0
                            };
                            MM.log("Tenemos un token valido!")

                            //Tenemos un token valido, intentado obtener infomación del sitio
                            MM.moodleWSCall('moodle_webservice_get_siteinfo', {}, function(d){
                                // Checamos por la versión minima requerida
                                // Checamos por el WebService presente, no por la versión del moodle
                                // Esto puede permitir algunos hacks como usar plugins locales por agregar funciones perdidas en versiones previas
                                var validMoodleVersion = false;
                                $.each(d.functions, function(index, el){
                                    //core_get_component_strings Desde Moodle 2.4
                                    if(el.name.indexOf("component_string") > -1){
                                        validMoodleVersion = true;
                                        MM.log("Tenemos una versión valida");
                                        return false;
                                    }
                                });

                                if(!validMoodleVersion){
                                    MM.log("Versión invalida del moodle");
                                }

                                d.id = hex_md5(d.siteurl + username);
                                d.token = mytoken;
                                var site = MM.db.insert('sites', d);

                                MM.setConfig('current_site', d);
                                MM.log("Conectados!");
                                $.mobile.loading('hide');
                                //Llamamos la función para cargar el sitio
                                MM.log("Id de sitio: " + site.id);
                                MM.loadSite(site.id);
                            }, preSets);


                        }
                        else{
                            MM.log("Cuenta invalida/no se puede acceder");
                            alert("Cuenta invalida/no se puede acceder");
                            $.mobile.loading('hide');
                        }
                    },
                error:
                    function(xhr, textStatus, errorThrown){
                        MM.log("No se puede conectar");
                        alert("No se puede conectar");
                        $.mobile.loading('hide');
                    }
            });
        return false;
    },

    registrarPlugin: function(plugin){
        var pluginName = plugin.settings.name;

        //Cargar plugin en el namespace principal
        this.plugins[pluginName] = plugin;

        for(var el in plugin.routes){
            var route = plugin.routes[el];
            //Route [0] URL to match, Route[1] id, Route[2] funcion a llamar
            this.Router.route(route[0], route[1], this.plugins[pluginName][route[2]]);
        }
        this.cargarModelos(plugin.storage);

        //Cargar cadenas predeterminadas
        /*if (plugin.settings.lang.component != 'core'){
            MM.lang.loadPluginLang(pluginName, JSON.parse(plugin.settings.lang.strings));    <--------------**********
        }*/

        // Sync hooks (like cron jobs)
        /*if (typeof(plugin.sync) != 'undefined') {
            MM.sync.registerHook(pluginName, plugin.sync);
        }*/
    },

    cargarModelos: function(elements){
      for(var el in elements){
          var obj = elements[el];

          // This allow plugins to load Backbone properties to models and collections
          if(typeof obj.bbpropierties == 'undefined'){
              obj.bbpropierties = {};
          }

          if(obj.type == 'model'){
              this.models[el] = Backbone.Model.extend(obj.bbpropierties);
          }
          else if(obj.type == 'collection'){
              obj.bbpropierties.model = this.models[obj.model];
              obj.bbpropierties.localStorage = new Store(el);
              var col = Backbone.Collection.extend(obj.bbpropierties);
              //Ahora la instancia
              this.collections[el] = new col();
          }
      }
    },

    cargarRutas: function(){
        var routes = [
            ['salir','salir', MM.salir]
        ];

        for(var el in routes){
            var route = routes[el];
            this.Router.route(route[0], route[1], route[2]);
        }
        MM.log("Rutas cargadas");
    },

    moodleWSCall: function(method, data, callBack, preSets, errorCallBack){
        // Forzar elementos de datos para ser cadenas
        for (var el in data){
            data[el] = data[el] + '';
        }

        if(typeof(preSets) == 'undefined' || preSets == null){
            preSets = {};
        }

        if(typeof(preSets.cache) == 'undefined'){
            preSets.cache = 1;
        }

        if(typeof(preSets.sync) == 'undefined'){
            preSets.sync = 0;
        }
        if(typeof(preSets.silently) == 'undefined'){
            preSets.silently = false;
        }
        if(typeof(preSets.omitExpires) == 'undefined'){
            preSets.omitExpires = false;
        }
        if(typeof(preSets.wstoken) == 'undefined'){
            var mytoken = MM.config.current_token;
            if(!mytoken){
                MM.log("MM: moodleWSCall: error inesperado");
                return false;
            }
        }
        else{
            var mytoken = preSets.wstoken;
        }

        if(typeof(preSets.siteurl) == 'undefined'){
            var siteurl = MM.config.current_site.siteurl;
            if(!siteurl){
                MM.log("MM: moodleWSCall: error inesperado");
                return false;
            }
        }
        else{
            var siteurl = preSets.siteurl;
        }

        data.wsfunction = method;
        data.wstoken = mytoken;

        var ajaxURL = siteurl + '/webservice/rest/server.php?moodlewsrestformat=json';
        var ajaxData = data;

        //Llamada principal jQuery Ajax, regresa en formato json
        $.ajax({
            type: 'POST',
            url: ajaxURL,
            data: ajaxData,
            dataType: 'json',

            success: function(data){
                if(!data){
                    if(errorCallBack){
                        errorCallBack();
                    }
                    else{
                        MM.log("No se puede conectar");
                    }
                    return;
                }

                if(typeof(data.exception) != 'undefined'){
                    if(data.errorCode == "invalidtoken" || data.errorCode == "accesexception"){
                        MM.log("Conexión perdida");
                        setTimeout(function(){
                            MM.setConfig("current_site", null);
                            location.href = "index.html";
                        }, 10000);
                        return;
                    }
                    else{
                        if(errorCallBack){
                            errorCallBack('Error. ' + data.message);
                        }
                        else{
                            MM.log('Error. ' + data.message);
                        }
                        return;
                    }
                }

                if(typeof(data.debuginfo) != 'undefined'){
                    if(errorCallBack){
                        errorCallBack("Error inesperado");
                    }
                    else{
                        MM.log("Error inesperado");
                    }
                    return;
                }

                MM.log('WS: Datos recibidos del WS ' + typeof(data));

                if(typeof(data) == 'object' && typeof(data.length) != 'undefined'){
                    MM.log('WS: Numero de datos de los elementos ' + data.length);
                }

                if(preSets.cache){
                    //MM.cache.addWSCall(ajaxURL, ajaxData, data);
                }

                callBack(JSON.parse(JSON.stringify(data)));
            },
            error: function(xhr, ajaxOptions, thrownError){
                var error = "No puedo conectar";   // <---------------------------------
                if(xhr.status == 404){
                    error = "Esquema invalido";
                }
                if(!preSets.silently){
                    MM.log(error+"eee");
                }
                else{
                    MM.log('WS: error' + method + 'error: ' + error);
                }
                if(errorCallBack){
                    errorCallBack();
                }
            }
        });
    },
    popErrorMessage: function(text) {

        if(!text) {
            return;
        }
        // Reset routing to avoid leave the user stuck, see MOBILE-307
        MM.Router.navigate("");

        var options = {
                title: MM.lang.s('error'),
                autoclose: 5000
            };
        this.popMessage(text, options);
    },
      fixPluginfile: function(url, token) {

        // This function is used in regexp callbacks, better not to risk!!
        if (!url) {
            return '';
        }

        if (!token) {
            token = MM.config.current_token;
        }

        // First check if we need to fix this url or is already fixed.
        if (url.indexOf('token=') != -1) {
            return url;
        }

        // Check if is a valid URL (contains the pluginfile endpoint).
        if (url.indexOf('pluginfile') == -1) {
            return url;
        }

        // In which way the server is serving the files? Are we using slash parameters?
        if (url.indexOf('?file=') != -1) {
            url += '&';
        } else {
            url += '?';
        }
        url += 'token=' + token;

        // Some webservices returns directly the correct download url, others not.
        if (url.indexOf('/webservice/pluginfile') == -1) {
            url = url.replace('/pluginfile', '/webservice/pluginfile');
        }
        return url;
    },

    log: function(text, component){
        if(!component){
            component = 'Core'
        }

        var d = new Date();
        text = d.toLocaleString() + ' ' + component + ': ' + text;

        if(window.console){
            console.log(text);
        }
    },

    setConfig: function(name, value, site){
        var setting = {
            id: name,
            name: name,
            value: value
        };

        if(site && MM.config.current_site){
            setting.id = MM.config.current_site.id + '-' + name;
        }

        MM.db.insert('settings', setting);
    },

    salir: function(){
        MM.log("Saliendo");
        MM.setConfig("current_site", null);
        MM.setConfig("current_token", null);
        MM.config.current_site = null;
        MM.config.current_token = null;
        $.mobile.loading( 'show', {
            text: 'Saliendo',
            textVisible: true,
            theme: 'b'
        });
        setTimeout(function(){
            location.href = "index.html";
            $.mobile.loading('hide');
        }, 1000);
 
    },

    centroIzquierda: function(){
        $('#panel-centro').css('display','none');
    },
    ocultarCentro: function(){
        $('#panel-centro').css('display', 'none');
    },
    mostrarCentro:function(){
        $('#panel-centro').css('display', 'block');
    },
    home:function(){
       // $('#secundario').css('display', 'none');
        //$('#contenido').css('display', 'block');
        //$('#principal').css('display', 'block');
    },

    mostrarCentro:function(){
        $('#contenido').css('display', 'block');
    },
    ocultarPrincipal: function(){
        $('#principal').css('display', 'none');
    },
    ocultarSecundario: function(){
        $('#secundario').css('display', 'none');

    },

    ocultarDer: function(){
        $('#panel-der').css('display', 'none');
    },
     ocultarMenu: function(){
        $(' #cabezera').css("display", "none");
    },
    mostrarMenu: function (){
        $(' #cabezera').css("display", "block");
    },

    mostrarDer: function(){
        $('#panel-der').css('display', 'block');
    },
    mostrarPrincipal:function(){
        $('#secundario').css('display', 'none');
        $('#principal').css('display', 'block');
    },
    mostrarSecundario:function(){
         $('#principal').css('display', 'none');
        $('#secundario').css('display', 'block');
    },
    ocultarSecundario:function(){
        $('#secundario').css('display', 'none');
    },
    
    cursos: function() {
        var output = MM.tpl.render($('#cursos_template').html(), values);
        $(' #principal').html(output).trigger("create");
         $(' #principal').css("display", "block");
      //  $(' #panel-der').css("display", "none");
    },
    mensajes: function(){

         $('#panel-der-der').css('display', 'block');
    },
   
    eventos: function (){
        var output3 = MM.tpl.render($('#eventos_template').html(), values);
        $(' #panel-der').html(output3).trigger("create");
        
    }, 
    /*participantes: function (){
        var output4 = MM.tpl.render($('#participantes_template').html(), values);
        $(' #secundario').html(output4).trigger("create");
        
    },*/
    calendario: function(){
        //alert("hol");
        var output1 = MM.tpl.render($('#calendario_template').html(), values);
        $('#principal').html(output1).trigger("create");
        $('#principal').css("display", "block");
      //  $('#principal #panel-centro').css("display", "none");
        defaults();
        //$(this).unbind('click');
    },
    calendario1: function(){
        var output2 = MM.tpl.render($('#calendario_eventos_template').html(), values);
        $('#principal').html(output2).trigger("create");
    }
};



  