const mqtt = require('mqtt');
const ewelink = require('ewelink-api');

//credenciales MQTT
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});

//credenciales eWeLink
const ewelinkClient = new ewelink({
  email: process.env.EWELINK_EMAIL,
  password: process.env.EWELINK_PASSWORD,
  region: process.env.EWELINK_REGION
});

//mapeo de IDs a topicos MQTT
const deviceTopicMap = {
  '100161df07': 'SONOFF/banda_transportadora/estado',
  '10016169c6': 'SONOFF/enjabonado/estado',
  '1001611bb2': 'SONOFF/cepillado/estado',
  '10016142b8': 'SONOFF/secado/estado',

};

//publicar el estado
async function publishDeviceState(deviceId) {
  const device = await ewelinkClient.getDevice(deviceId);
  const topic = deviceTopicMap[deviceId];
  const message = JSON.stringify(device.params.switch);
  mqttClient.publish(topic, message);
  console.log(`Publicado en ${topic}: ${message}`);
}

//actualizar el estado
function updateDeviceState(deviceId) {
  setInterval(() => {
    publishDeviceState(deviceId);
  }, 1000);
}

//conectar al broker MQTT y empezar a actualizar el estado
mqttClient.on('connect', () => {
  console.log('Conectado al broker MQTT');
  Object.keys(deviceTopicMap).forEach((deviceId) => {
    console.log(
      `Iniciando actualización de estado para el dispositivo ${deviceId}`,
    );
    updateDeviceState(deviceId);
  });
});

ewelinkClient
  .getDevices()
  .then((devices) => {
    console.log(
      'Conectado a la API de eWeLink, dispositivos encontrados:',
      devices,
    );
  })
  .catch((error) => {
    console.error('Error conectando a la API de eWeLink:', error);
  });
