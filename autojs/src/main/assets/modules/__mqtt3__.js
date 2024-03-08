module.exports = function (runtime, scope) {
    importPackage(org.eclipse.paho.client.mqttv3);
    importPackage(org.eclipse.paho.client.mqttv3.persist);
    var mqtt3 = {};

    mqtt3.qos = 2;
    mqtt3.onMessage = (topic, msg) => {}
    mqtt3.onConnectionLost = (cause) => {}
    mqtt3.onDeliveryComplete = (token) => {}

    mqtt3.connect = function(broker, clientId) {
        let persistence = new MemoryPersistence();
        let client = new MqttClient(broker, clientId, persistence);
        let connOpts = new MqttConnectOptions();
        connOpts.setCleanSession(true);
        connOpts.setAutomaticReconnect(true);
        let result = client.connect(connOpts);
        client.setCallback({
            connectionLost: function(cause) {
                mqtt3.onConnectionLost(cause)
            },
            messageArrived: function(topic, message) {
                let id = message.getId()
                let payload = message.getPayload()
                let qos = message.getQos()

                let text = null
                let json = null

                try {
                    text = new java.lang.String(payload)
                } catch(e) {
                    // Payload is not text
                }

                if (text) {
                    try {
                        json = JSON.parse(text)
                    } catch(e) {
                        // Payload is not json
                    }
                }

                let data = {
                    id: id,
                    payload: payload,
                    qos: qos,
                    text: text,
                    json: json
                }

                mqtt3.onMessage(topic, data)
            },
            deliveryComplete: function(token) {
                mqtt3.onDeliveryComplete(token)
            }
        })
        mqtt3.__client__ = client;
    }

    mqtt3.subscribe = function(topicFilter) {
        mqtt3.__client__.subscribe(topicFilter)
    }

    mqtt3.setQos = function(qos) {
        mqtt3.qos = qos
    }

    mqtt3.disconnect = function() {
        mqtt3.__client__.disconnect()
    }

    mqtt3.publishText = function(topic, text) {
        let str = java.lang.String(text)
        let msg = new MqttMessage(str.getBytes());
        msg.setQos(mqtt3.qos);
        mqtt3.__client__.publish(topic, msg);
    }

    mqtt3.publishObj = function(topic, obj) {
        mqtt3.publishText(topic, JSON.stringify(obj))
    }

    mqtt3.setOnMessage = function(callback) {
        mqtt3.onMessage = callback
    }

    mqtt3.setOnConnectionLost = function(callback) {
        mqtt3.onConnectionLost = callback
    }

    mqtt3.setOnDeliveryComplete = function(callback) {
        mqtt3.onDeliveryComplete = callback
    }

    return mqtt3;
}