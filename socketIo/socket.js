const db = require('../db/nodejs-orm/index')
let User = db.model('user')
let Chat = db.model('chat')
module.exports = function (server) {
  // 得到IO对象
  const io = require('socket.io')(server, { cors: true })
  // 监视连接，（当有一个客户端连接上时的回调）
  io.on('connection', async function (socket) {
    console.log('有一个客户端连接上了', socket.id);
    // 绑定发送消息的监听
    // socket.on('clientSendMsg', function (data) {
    //   console.log('浏览器发消息了', data);
    // })
    // io.emit('serverSendMsg', {
    //   name: '我是服务器',
    //   content: '今天天气好凉快！！！！'
    // })
    // 查询friends列表，然后发出事件
    await User.find((err, data) => {
      // console.log(data);
      io.emit('friendList', data)
    })

    // 接收浏览器发送的消息
    socket.on('sendMsg', async (data) => {
      console.log(data);
      // 接收消息
      io.emit('accept', data) 
      // data为每次聊天的对象
      // 将每次的对象保存到数据库当中
      await Chat.insert({
        user_id: data.user.user_id,
        friend_id: data.friend.friend_id,
        friend_name: data.friend.friend_username,
        content: data.content,
      }, (err, suc) => {
        // console.log(suc);
        if (suc) {
          console.log('发送成功，数据库添加成功');

        }
      })
      
    })
    // 接收聊天记录事件
    socket.on('findMsg', async (data) => {
      console.log(data);
      await Chat.find(`user_id="${data.user_id}" and friend_id="${data.friend_id}"`, (err, suc) => {
        // console.log(err, suc);
        if (suc) {
          // 将消息返回给前端进行展示
          io.emit('sendMsgArr', suc)
        }
      })
    })


  })

}