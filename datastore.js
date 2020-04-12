const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const keysAsync = promisify(client.keys).bind(client);
const delAsync = promisify(client.del).bind(client);

const setClient = async (client) => {
  await setAsync(`client_${client.socketID}`, JSON.stringify(client));
}

const getClient = async (socketID) => {
  const key = socketID.includes('client_') ? socketID : `client_${socketID}`;
  const data = await getAsync(key);
  return JSON.parse(data);
}

const getClients = async () => {
  // retrieve key-values: [client_${socketID}]: { clientID, socketID, health: { ... } }
  const keys = await keysAsync('client_*');
  console.log(keys);
  return Promise.all(
    keys.map(
      key => getClient(key)
    )
  );
}

const deleteClient = async (socketID) => {
  await delAsync(`client_${socketID}`);
}

module.exports = {
  getClient,
  getClients,
  setClient,
  deleteClient
}
