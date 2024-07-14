const jwt = require('jsonwebtoken')

const secret = process.env.JWT_SECRET

const signToken = (payLoad) => {
    return jwt.sign(payLoad,secret)
}

const verifyToken = (token) => {
    return jwt.verify(token,secret)
}

module.exports = {
    signToken,
    verifyToken
}