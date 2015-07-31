var mqtt = require('mqtt');
var qiniu = require('qiniu');
var config = require('./config.js');

qiniu.conf.ACCESS_KEY = config.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.SECRET_KEY;

var uptoken = new qiniu.rs.PutPolicy2({
	scope: config.Bucket_Name,
	expires: 31536000,
	returnBody: {
		"success": true
	}
});

var topic = "qiniu";
var mqttClientInstance = mqtt.connect("mqtt://localhost:1883", {clientId: topic});
mqttClientInstance.on('connect', function () {
    console.log("connect mqtt server success");
});
mqttClientInstance.on('error',function(error) {
    console.log("mqtt connect failed: ", error);
});
mqttClientInstance.subscribe(topic);

mqttClientInstance.on('message', function(messageTopic, data) {
	console.log("recv msg: "+data);
	var msg = JSON.parse(data);
	if(msg.request === "uptoken"){
		mqttClientInstance.publish(msg.clientId, JSON.stringify({uptoken: uptoken.token()}));
	} else if(msg.request === "downtoken"){
		var key = msg.key;
        var baseUrl = qiniu.rs.makeBaseUrl(config.Domain, key);
        var policy = new qiniu.rs.GetPolicy();
        mqttClientInstance.publish(msg.clientId, JSON.stringify({url: policy.makeRequest(baseUrl)}));
	} else {
		console.log("unknown msg");
	}	
});
/* when got exit signal, then exit
mqttClientInstance.end();
mqttClientInstance = null;
console.log("mqtt client has been destroyed");
*/