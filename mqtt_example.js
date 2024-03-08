let broker = "tcp://192.168.31.12:1883"
let clientId = "mqtt_test"
let topic = "test_topic"
let will_topic = "test_topic"

let client = new mqtt3.Client(broker, clientId)
console.log("连接中")
client.connect({
  automaticReconnect: true,
  timeout: 5,
  keepAliveInterval: 100,
  cleanSession: true,
  useSSL: true,
  userName: "",
  password: "",
  willMessage: { // 遗嘱消息
    destination: will_topic,
    data: { name: "a", age: 1 },
    qos: 2,
    retained: true
  }
})
client.setOnMessage((msg) => {
  console.log("收到消息", msg.topic, msg.id, msg.qos, msg.payload, msg.text, msg.json)
})
client.setOnConnectionLost((cause) => {
  console.log("连接丢失", cause)
})
console.log("连接成功")

// 订阅 test_topic
client.subscribe(topic)


// 方式一
client.publishText(topic, 'Test Message 1')
console.log("发送成功")

// 方式二
client.publishObj(topic, {
    name: "name2",
    age: 1
})
console.log("发送成功")

// 方式三
client.publish({
  topic: topic,
  qos: 2,
  data: {
    name: "name3",
    age: 1
  }
})
client.publish({
  topic: topic,
  qos: 2,
  data: "Text Message"
})
console.log("发送成功")