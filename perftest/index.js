const Promise = require('bluebird')
const WebSocket = require('ws')
const nbr = 200

const now = () => {
  return performance.now()
}

function Client(id) {
  this.ws = null
  this.start = function() {
    const that = this
    this.ws = new WebSocket('wss://172.17.192.1:3003/ws', { //Change to correct address, notice wss vs ws
      rejectUnauthorized: false
    })
    this.ws.on('open', function() {
      console.log(`client ${id} connected`)
      that.ws.send(JSON.stringify({
        type: 'createnewroom',
        username: id
      }))
      that.ws.on('message', function(data) {
        var msg = JSON.parse(data)
        if(msg.start) {
          msg.roudntrip=now() - msg.start     // roundtrip time in ms
          data=JSON.stringify(msg)
        }
        console.log('received from server: ', data)
        setTimeout(function() {
          that.send()
        }, Math.random() * 1000)
      })
    })
    this.ws.on('error', function() {
      console.log(error)
    })
    this.ws.on('close', function() {
      console.log('closed')
    })
  }
  this.send = function() {
      const data = {
        "type": "DRAW",
        "color": "black",
        "size": 5,
        "points": [
            {"x": 274, "y": 416},
            {"x": 274, "y": 416}
        ],
        start: now()
      }
      this.ws.send(JSON.stringify(data))
  }
}

const ids = Array.from(new Array(nbr), (x,i) => i)

Promise.map(ids, (id) => {
  const c = new Client(id)
  c.start()
  return Promise.resolve()
}).then(() => {
  console.log('all up')
})  