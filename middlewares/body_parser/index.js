const queryString = require('querystring')

function urlencoded (req, res, next) {
    let body = ''
    req.on('data', d => body += d.toString())
    req.on('end', () => {
        req.body = queryString.decode(body)
        next()
    })
    req.on('error', e => {
        throw e 
    })
}

module.exports = { urlencoded };