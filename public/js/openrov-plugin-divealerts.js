(function (window, $, undefined) {
    'use strict';

    var divealerts;
    var template = '';
    var beeptone = '';

    var dive_alert;
    dive_alert = function dive_alert(name,description,alerttype,rule){
      this.name = name;
      this.description = description;
      this.sleep_till = Date.now;
      //this.displayed = false;
      this.alerttype = alerttype;
      this.rule = rule;

      var self = this;
      this.test = function test(state){
        if (self.rule(state)) self.fire();
      };

      this.fire = function fire(){
        var rov=self;
      //  if (self.displayed) return;
        console.log('divealert:' + self.name + ' detected');
        if (Date.now() < self.sleep_till) return;
        $.growl(description, {element: '#video-container',
                              delay:1000*60*5,
                              type:this.alerttype,
                              template:template,
                              animate: {
                            		enter: 'animated fadeInDown',
                            		exit: 'animated fadeOutUp'
                            	}
        });
        var newtime = new Date();
        self.sleep_till = newtime.setMinutes(newtime.getMinutes()+5);
        var snd = new Audio(beeptone); // buffers automatically when created
        snd.play();
        //self.displayed = true;
      };
    }

    divealerts = function divealerts(cockpit) {
        console.log("Loading divealerts plugin in the browser.");

        // Instance variables
        this.cockpit = cockpit;
        this.alertloop = '';
        this.state = {};
        this.state.status = {};





        this.alerts = [];
        this.alerts.push(new dive_alert('AbnormalESCCurrent',
                                            'Current from ESCs for identical motor operations should not differ much. This may indicate failing berrings or a short in wiring.',
                                            'warning',
                                            function(state){
                                              // ESC pulling adnormal current warning
                                              var data = state.status;
                                              if (('motors' in data) && ('SC1I' in data) && ('SC3I' in data)){
                                                var motors = data.motors.split(',');
                                                //More than 50% difference triggers
                                                if ((motors[0] === motors[2]) && (Math.abs((data.SC1I-data.SC3I)/data.SC1I)>.5)){
                                                  return true
                                                }
                                              }
                                              return false;
                                            }));
        this.alerts.push(new dive_alert('RapidInternalTempDecrease',
                                            'Detected rapid internal temp change. This may indicate flooding!',
                                            'danger',
                                            function(state){
                                              // ESC pulling adnormal current warning
                                              var data = state.status;

                                              if ('BRDT' in data){
                                                if ('RapidInternalTempDecrease_priorBRDT' in state){
                                                  //trigger on a 5C change within 1 second
                                                  if (state.RapidInternalTempDecrease_priorBRDT - data.BRDT > 5){
                                                    return true
                                                  }
                                                }
                                                state.RapidInternalTempDecrease_priorBRDT = data.BRDT;
                                              }
                                              return false;
                                            }));

        this.alerts.push(new dive_alert('OneBatteryTube',
                                            'You are only drawing current from 1 battery tube. This may indicate a flooded tube, low battery charge, or a bad battery cell.',
                                            'warning',
                                            function(state){
                                              // ESC pulling adnormal current warning
                                              var data = state.status;

                                              if (('BT1I' in data) && ('BT2I' in data)){
                                                if ((parseFloat(data.BT1I) === 0.0) || (parseFloat(data.BT2I) ===0.0)){
                                                  return true
                                                }
                                              }
                                              return false;
                                            }));

    //example keyboard hook
    /*
    this.cockpit.emit('inputController.register',
      {
        name: "divealerts.keyBoardMapping",
        description: "Example for keymapping.",
        defaults: { keyboard: 'alt+0', gamepad: 'X' },
        down: function() { console.log('0 down'); },
        up: function() { console.log('0 up'); },
        secondary: [
          {
            name: "divealerts.keyBoardMappingDepdent",
            dependency: "divealerts.keyBoardMapping",
            defaults: { keyboard: '9', gamepad: 'RB' },
            down: function() { console.log('####'); }
          }
        ]
      });
    */

    // for plugin management:
    this.name = 'divealerts';   // for the settings
    this.viewName = 'divealerts plugin'; // for the UI
    this.canBeDisabled = true; //allow enable/disable
    this.enable = function () {
      var self = this;
      self.alertloop = setInterval(function(){
        for(var possible_alert in self.alerts){
          self.alerts[possible_alert].test(self.state);
        }
      },3000);
    };
    this.disable = function () {
      clearInterval(self.alertloop);
    };

    //this technique forces relative path to the js file instead of the excution directory
    var jsFileLocation = urlOfJsFile('openrov-plugin-divealerts.js');
    beeptone = jsFileLocation + '../alertsound.ogg';
    $.get(jsFileLocation + '../alerttemplate.html',function(data){
      template = data;
    });
    $.getScript('plugin_components/bootstrap.growl/dist/bootstrap-growl.min.js',function(){
      console.log("loaded");
      $.growl("The divealert plugin has loaded and is now ready to provide feedback!",{element: '#video-container', delay:1000, template:template, type:"info"});
    });
    this.enable();
  };

  //This will be called by the input manager automatically
  divealerts.prototype.listen = function listen() {
    var rov = this;

    this.cockpit.socket.on('status', function (data) {
      rov.state.status = data;
    });

    //This example will put an entry in the pop-up Heads Up Menu
    /*
    var item = {
      label: ko.observable("divealerts menu"),
      callback: function () {
        alert('divealerts menu item');
        item.label(this.label() + " Foo Bar");
      }
    };
    rov.cockpit.emit('headsUpMenu.register', item);
    */

  };

    window.Cockpit.plugins.push(divealerts);

}(window, jQuery));
