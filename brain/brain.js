var brain = require('brain')

module.exports = function(RED){
  function Brain(config){
    RED.nodes.createNode(this, config)

    var node = this

    node.status({
      fill: 'grey',
      shape: 'dot',
      text: 'waiting'
    })

    node.net = new brain.NeuralNetwork();

    this.on('input', function(msg){

      if (!!msg.neuralNetworkOptions && !!msg.trainData) node.net = new brain.NeuralNetwork(msg.neuralNetworkOptions)

      if (msg.netJSON) {
        //load network from external source
        node.net.fromJSON(msg.netJSON)
      }
      if (!!msg.runData){
        //got data to test, running current network
        msg.decision = node.net.run(msg.runData)
        node.status({
          fill: 'green',
          shape: 'dot',
          text: 'running done'
        })
        node.send(msg)
      } 
      else if (!!msg.trainData) {
        //got train data, training
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: 'training'
        })

        var trainStream = node.net.createTrainStream({

          floodCallback: function() {
            flood(trainStream, msg.trainData);
          },

          doneTrainingCallback: function(obj) {
            node.status({
              fill: 'green',
              shape: 'dot',
              text: 'trainning done'
            })
            msg.net = node.net.toJSON()
            node.send(msg)
          }
        });

        flood(trainStream, msg.trainData);

        function flood(stream, data) {
          for (var i = 0; i < data.length; i++) {
            stream.write(data[i]);
          }

          stream.finishStreamIteration();
        }
      }
    })
  }

  RED.nodes.registerType('brain2', Brain)
}
