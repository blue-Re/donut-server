var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken')

const handleDB = require('../db/handleDB')

let token
const salt = '@!$!@#%#@$#$@'

// 登陆接口
router.post('/login', function (req, res) {
  (async function () {
    // 获取参数
    const { username, password } = req.body
    // 查询数据库，判断当前参数是否与数据库数据一致
    let result = await handleDB(res, 'user', 'find', '数据库查询失败', `username="${username}"`)
    // console.log(result);
    // 如果数据库没有该用户
    if (!result[0]) {
      res.send({ msg: '用户名未注册' })
      return
    }
    // 如果有，判断数据库参数与当前参数是否一致
    if (result[0].username !== username || result[0].password !== password) {
      res.send({ msg: '用户名或密码错误' })
      return
    }
    // 设置token
    token = jwt.sign({ id: result[0].id, }, salt, { expiresIn: 1000 * 60 * 60 * 24 })
    req.headers['token'] = token

    res.send({
      code: 0,
      msg: '登陆成功',
      token,
      data: result[0]
    })
  })()
})

// 注册接口
router.post('/register', (req, res) => {
  (async function () {
    // 获取请求参数
    const { username, password, email } = req.body
    // 查询数据库，看看是有已注册的用户
    let result = await handleDB(res, 'user', 'find', '查询数据库出错了', `username="${username}"`)
    // 如果存在，返回错误信息
    if (result[0]) {
      res.send({
        code: 1,
        msg: '用户名已存在'
      })
      return
    }
    // 不存在,往数据库添加一条记录
    let newUser = await handleDB(res, 'user', 'insert', '添加数据出错了', {
      username,
      password,
      email
    })
    console.log(newUser);
    res.send({
      code: 0,
      msg: '注册成功'
    })
  })()

})

module.exports = router;
