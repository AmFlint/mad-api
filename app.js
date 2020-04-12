const app = require('express')();
const http = require('http').createServer(app);
const socketIO = require('socket.io')(http);
const socketRedis = require('socket.io-redis');
const {
  getClient,
  getClients,
  setClient,
  deleteClient
} = require('./datastore');

socketIO.adapter(socketRedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
}));

app.get('/health', (req, res) => {
  return res.json({
    healthy: true
  });
});

socketIO.on('connection', socket => {
  // Clients-related 
  socket.on('client_connected', async client => {
    console.log('New client connected');
    // Add Client to list of clients logged in at the same time
    const dbClient = {
      ...client,
      socketID: socket.conn.id,
    }
    await setClient(dbClient);
    // Emit connected to web console
    socket.broadcast.emit('web_client_update', dbClient);
  })

  // socket.on('client_disconnected', client => {
  //   // TODO
  //   if (!clients[client.id]) return;
  //   delete clients[client.id];
  //   // Emit disconnected to web console
  //   socket.broadcast.emit('web_client_disconnect', client.id);
  // })

  socket.on('client_healthcheck', async client => {
    const data = {
      ...client,
      socketID: socket.conn.id,
    }
    await setClient(data);
    // Update web console
    socket.broadcast.emit('web_client_update', data);
  })

  socket.on('web_connected', async () => {
    // Send informations about current clients
    let clients = [];
    try {
      clients = await getClients();
    } catch (error) {
      console.log(error);
    }
    socket.emit('load_clients', clients);
  })

  socket.on('disconnect', async () => {
    // remove client from socket id
    const client = await getClient(socket.conn.id);
    // If client not found (either webconsole disconnected or just state is out of date)
    if (!client) return;
    await deleteClient(socket.conn.id);
    socket.broadcast.emit('web_client_disconnect', client.id);
  })
});

const port = process.env.PORT || 3000;
http.listen(port, () => console.log(`Listening on ${port}`))
