const db = require('../db/nodejs-orm/index')

async function handleDB(res,tableName,methodName,errorMsg,conditionOne,conditionTwo) {
  let table = db.model(tableName)
  let result
  try {
    result = await new Promise((resolve,reject)=>{
      // 如果不传入第一个条件，默认查询所有
      if (!conditionOne) {
        table[methodName]((err,data)=>{
          if (err) reject(err)
          resolve(data)
        })
        return
      }
      // 如果不传入第二个条件，默认按照条件1查询
      if (!conditionTwo) {
        table[methodName](conditionOne,(err,data)=>{
          if(err) reject(err)
          resolve(data)
        })
        return
      }
      // 如果两个条件都传入了
      table[methodName](conditionOne,conditionTwo,(err,data)=>{
        if(err) reject(err)
        resolve(data)
      })
    })
  } catch (error) {
    console.log(error);
    res.send({
      code:1,
      errMsg:errorMsg
    })
    return
  }
  return result
}
module.exports = handleDB