function divealerts(name, deps) {
    console.log("This is where plugin code for divealerts loads in the node process.");

  //This is how you would register a listner to traffic from the browser
  /*
  deps.io.sockets.on('connection', function (socket) {
    socket.on('some_message_from_browser', function () {
      //sending on to the rov via the serial connection
      deps.rov.send('msg(0)');
      console.log('msg(0) sent');
    });
  });
  */

  //This is how you would register a listner to traffic from the ardunio
  //or other parts of the node modules and forward it to the browser
  /*
  deps.globalEventLoop.on('messageIwantToForward', function (data) {
    deps.io.sockets.emit('messageIwantToForward', data);
  });
  */
};

module.exports = divealerts;
