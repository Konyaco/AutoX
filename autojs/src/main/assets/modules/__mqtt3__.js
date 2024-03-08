module.exports = function (runtime, scope) {
    importPackage(org.eclipse.paho.client.mqttv3);
    importPackage(org.eclipse.paho.client.mqttv3.persist);
    var mqtt3 = {};

    mqtt3.Client = function(broker, clientId) {
        this.broker = broker
        this.clientId = clientId
        this.onMessage = (msg) => {}
        this.onConnectionLost = (cause) => {}
        this.onDeliveryComplete = (token) => {}
        this.qos = 2

        this.connect = function(options) {
            let connOpts = new MqttConnectOptions();
            if (options.automaticReconnect) connOpts.setAutomaticReconnect(options.automaticReconnect);
            if (options.timeout) connOpts.setConnectionTimeout(options.timeout);
            if (options.keepAliveInterval) connOpts.setKeepAliveInterval(options.keepAliveInterval)
            if (options.cleanSession) connOpts.setCleanSession(options.cleanSession);
            if (options.userName) connOpts.setUserName(options.userName);
            if (options.password) connOpts.setPassword(new java.lang.String(options.password).toCharArray());
            if (options.willMessage) {
                let {data, destination, qos, retained} = options.willMessage
                let msgStr;
                if (typeof data === 'object') {
                    msgStr = java.lang.String(JSON.stringify(data))
                } else {
                    msgStr = java.lang.String(data)
                }
                connOpts.setWill(destination, msgStr.getBytes(), qos, retained);
            }

            let persistence = new MemoryPersistence();
            let client = new MqttClient(broker, clientId, persistence);
            let result = client.connect(connOpts);

            let that = this
            client.setCallback({
                connectionLost: function(cause) {
                    that.onConnectionLost(cause)
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
                        topic: topic,
                        id: id,
                        payload: payload,
                        qos: qos,
                        text: text,
                        json: json
                    }

                    that.onMessage(data)
                },
                deliveryComplete: function(token) {
                    that.onDeliveryComplete(token)
                }
            })
            this.__client__ = client;
        }

        this.subscribe = function(topicFilter) {
            this.__client__.subscribe(topicFilter)
        }

        this.disconnect = function() {
            this.__client__.disconnect()
        }

        this.publishText = function(topic, text, qos) {
            this.publish({
                topic: topic,
                data: text,
                qos: qos
            })
        }

        this.publishObj = function(topic, obj, qos) {
            this.publish({
                topic: topic,
                data: obj,
                qos: qos
            })
        }

        this.publish = function(obj) {
            let {topic, qos, data} = obj
            let msgStr;
            if (typeof data === 'object') {
                msgStr = java.lang.String(JSON.stringify(data))
            } else {
                msgStr = java.lang.String(data)
            }
            let msg = new MqttMessage(msgStr.getBytes());
            msg.setQos(qos || this.qos);
            this.__client__.publish(topic, msg);
        }

        this.setOnMessage = function(callback) {
            this.onMessage = callback
        }

        this.setOnConnectionLost = function(callback) {
            this.onConnectionLost = callback
        }

        this.setOnDeliveryComplete = function(callback) {
            this.onDeliveryComplete = callback
        }
    }

    mqtt3.WillMessage = function(obj) {
        this.data = obj.data
        this.destinationName = obj.destinationName
        this.qos = obj.qos
        this.retained = obj.retained
    }
    return mqtt3;
}