var express = require('express');
const path = require('path')
var router = express.Router();
const handleDB = require('../db/handleDB')

// 导入七牛上传图片的函数
const upload_file = require('../utils/qiniu')

// 配置上传图片的模块
const multer = require('multer')
let upload = multer({ dest: 'public/images' })
// const socket = require('../socketIo/socket')



// 定义常量
const QI_NIU_ADDRESS = 'http://qx51tdoeg.hb-bkt.clouddn.com/image/avatar/'

// 获取数据库所有的用户
router.get('/user', function (req, res, next) {
  (async function () {
    let UserInfo = await handleDB(res, 'user', 'find', '数据库查询出错了!')
    // console.log(UserInfo);
    res.send({
      code: 0,
      data: UserInfo
    })
  })()
});

// 发送消息接口
router.post('/send', (req, res) => {
  (async function () {
    // 获取参数
    const { user_id, friend_id, content } = req.body
    // 添加数据
    let result = await handleDB(res, 'chat', 'insert', '数据库添加出错了', { user_id, friend_id, content })
    // console.log(result);

    // res.send({
    //   code: 0,
    //   data: result
    // })
  })()
  return
})

// 获取数据库所有的消息接口
router.get('/getMessage', (req, res) => {
  (async function () {
    let result = await handleDB(res, 'message', 'find', '数据库查询出错了')
    if (result) {
      res.send({
        code: 0,
        data: result
      })
    }
  })()
})

// 获取当前所有用户针对于另一个用户的相关聊天信息列表
router.get('/currentUserAllMsg', (req, res) => {
  let { user_id, friend_id } = req.query
  console.log(user_id, friend_id);
  (async function () {
    let result = await handleDB(res, 'chat', 'find', '数据库查询出错了', `user_id="${user_id}" and friend_id="${friend_id}"`)
    // console.log(result);
    res.send({
      code: 0,
      data: result
    })
  })()
})

// 获取登陆的用户信息
router.get('/currentUser', async (req, res) => {
  // 获取参数
  let { current_id } = req.query
  // 查询数据库
  let result = await handleDB(res, 'user', 'find', '数据库查找出错了', `id="${current_id}"`)
  current_user = result[0]
  if (result[0]) {
    res.send({
      code: 0,
      data: result[0]
    })
  }
})

// 图片上传接口
router.post('/uploadImg', upload.single('avatar'), (req, res) => {
  (async function () {
    // 1.接收上传的图片
    let file = req.file
    // 获取参数,当前登录用户的id
    let { current_id } = req.query
    // 2.上传到第三方服务器
    try {
      var retObj = await upload_file(file.originalname, `${file.destination}/${file.filename}`)
      console.log(retObj);
    } catch (error) {
      console.log(error);
      res.send(error)
      return
    }
    // 3.修改user表中的avatar_url,其实就是跟新数据库
    await handleDB(res, 'user', 'update', '更新数据库出错', `id="${current_id}"`, { avatar_url: QI_NIU_ADDRESS + file.originalname })
    // 将修改后的图片链接返回给前端
    res.send({
      code: 0,
      data: {
        avatar_url: QI_NIU_ADDRESS + file.originalname
      },
    })
  })()

})

// 修改用户信息接口
router.post('/updateUserInfo', (req, res) => {
  (async function () {
    // 获取参数
    let { username, password, email } = req.body
    let { current_id } = req.query
    // 对user数据库表的信息进行修改
    let result = await handleDB(res, 'user', 'update', '更新数据库出错', `id="${current_id}"`, { username, password, email })
    if (result) {
      res.send({
        code: 0,
        msg: '数据库修改成功'
      })
    }
  })()
})

// 发布动态接口
router.post('/publish', upload.single('file'), (req, res) => {
  (async function () {
    // 获取请求参数
    let user = req.query
    // 1.接收上传的图片
    let file = req.file
    console.log(file);
    if (file !== undefined) {
      // 2.上传到第三方服务器
      try {
        var retObj = await upload_file(file.originalname, `${file.destination}/${file.filename}`)
        console.log(retObj);
      } catch (error) {
        console.log(error);
        res.send(error)
        return
      }

      // 向数据库中添加一条数据
      let result = await handleDB(res, 'dynamic', 'insert', '添加数据库出错', {
        username: user.username,
        avatar_url: user.avatar_url,
        isfocus: false,
        content: user.content,
        imglist1: QI_NIU_ADDRESS + file.originalname
      })

      if (result) {
        // 如果添加成果了，那就继续查询数据库
        // 查找数据库，将表中所有的动态查询出来
        let result1 = await handleDB(res, 'dynamic', 'find', '数据库查询出错了')
        if (result1) {
          res.send({
            code: 0,
            data: result1,
            mgs: '已将数据库的数据查询出来'
          })
        }
      } else {
        res.send({
          code: 1,
          msg: '数据库添加出错了'
        })
      }
    } else {
      // 向数据库中添加一条数据
      let result = await handleDB(res, 'dynamic', 'insert', '添加数据库出错', {
        username: user.username,
        avatar_url: user.avatar_url,
        isfocus: false,
        content: user.content,
      })

      if (result) {
        // 如果添加成果了，那就继续查询数据库
        // 查找数据库，将表中所有的动态查询出来
        let result1 = await handleDB(res, 'dynamic', 'find', '数据库查询出错了')
        if (result1) {
          res.send({
            code: 0,
            data: result1,
            mgs: '已将数据库的数据查询出来'
          })
        }
      } else {
        res.send({
          code: 1,
          msg: '数据库添加出错了'
        })
      }
    }
  })()
})

// 查找动态
router.get('/allDynamic', (req, res) => {
  (async function () {
    let result = await handleDB(res, 'dynamic', 'find', '查找数据库出错了')
    if (result.length > 0) {
      res.send({
        code: 0,
        msg: '查找成功',
        data: result
      })
    }
  })()
})

// 动态评论接口
router.post('/remark', (req, res) => {
  (async function () {
    // 获取参数
    let { remark_username, dynamic_id, remark_content } = req.body
    // 根据参数查找当前用户的头像
    let result = await handleDB(res, 'user', 'find', '查找数据库出错了', `username="${remark_username}"`)

    // 拿到用户的头像
    let remark_user_avatar = result[0].avatar_url
    // 拿到对应的动态的id，需要查找dynamic表，它的id就为动态的id
    let result1 = await handleDB(res, 'dynamic', 'find', '查找数据库出错了', `dynamic_id="${dynamic_id}"`)
    // 拿到动态的id
    let dynamicId = result1[0].dynamic_id

    // 将此条评论保存到数据库中
    await handleDB(res, 'remark', 'insert', '添加数据库失败', {
      remark_username,
      dynamic_id: dynamicId,
      remark_content,
      remark_user_avatar
    })

    // 评论成功后，查询出对应动态的对应评论
    let result2 = await handleDB(res, 'remark', 'find', '查找数据库出错了', `dynamic_id="${dynamic_id}"`)
    res.send({
      code: 0,
      msg: '评论成功',
      data: result2
    })
  })()
})

// 查找所有的对应的动态评论
router.get('/allRemark', (req, res) => {
  (async function () {
    let {dynamic_id} = req.query
    // 查找数据库，找到对应动态的所有评论
    let result = await handleDB(res,'remark','find','查找数据库出错了',`dynamic_id="${dynamic_id}"`)
    if (result) {
      res.send({
        code:0,
        data:result,
        msg:'初始化评论数据查找成功'
      })
    }
  })()
})
module.exports = router;
