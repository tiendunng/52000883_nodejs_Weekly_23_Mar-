require('dotenv').config();
const express = require('express');
const sessions = require('express-session');
const { engine } = require('express-handlebars');
const userService = require('./users/index');
const bodyParser = require('./middlewares/body_parser');
const flashMessage = require('./middlewares/flash_message');
const cookieParser = require('cookie-parser')
const { check, validationResult } = require('express-validator');
const flash = require('express-flash')
const rateLimit = require('express-rate-limit')

const host = process.env.HOST;
const port = process.env.PORT;

const app = express();
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: 'Quá nhiều request tới website, vui lòng thử lại sau'
})

app.set('view engine', 'handlebars');
app.engine('handlebars', engine({
    layoutsDir: __dirname + '/views/layouts',
    defaultLayout: 'index',
}));

app.use(sessions({
    secret: "my_secret_key",
    saveUninitialized:true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    resave: false
}));
app.use(cookieParser('secret'))
app.use(flash())
//app.use(flashMessage)
app.use(bodyParser.urlencoded)
app.use(limiter)

app.get('/', async (req, res) => {
    let message = req.flash('message')
    let type = req.flash('type')
    let editId = req.flash('id')
    let editErr = req.flash('edit-err')
    let data = await userService.getUsers()
    res.render('main', {data: {users: data}, flash: {message, type}, edit: {editId, editErr}, oldData: req.flash('old-data')[0]});
})

app.get('/createUser', (req, res) => {
    let message = req.flash('message')
    let oldData = req.flash('oldData')
    res.render('createUser', {message, data: oldData[0]});
})

app.get('/delete/:id', async (req, res) => {
    let result = await userService.deleteUser(req.params.id)
    req.flash('message', result.message)
    if (result.code !== 0) {
        req.flash('type', 'danger')
    }
    else {
        req.flash('type', 'success')
    }    
    return res.redirect ('/')
})

const isValid = [check('name').exists('Vui lòng nhập tên người dùng')
.notEmpty().withMessage('Vui lòng nhập tên người dùng')
.isLength({min: 3}).withMessage('Vui lòng nhập tên có nhiều hơn 3 kí tự'),
check('gender').isIn(['male', 'female']).withMessage('Vui lòng nhập giới tính hợp lệ'),
check('age').isInt({min: 18, max: 120}).withMessage('Vui lòng nhập tuổi hợp lệ'),
check('email').isEmail().withMessage('Vui lòng nhập email hợp lệ')
]

app.post('/users', isValid, async (req, res) => {
    let {name, gender, age, email} = req.body

    //Check validation
    let errors = validationResult(req)
    if (errors.errors.length > 0) {
        req.flash('oldData', {name, gender, age, email})
        req.flash('message', errors.errors[0].msg)
        return res.redirect('/createUser')
    }

    let result = await userService.addUser({id: Math.floor(Math.random() * 1000), fullName: name, email: email, gender: gender, age: age})
    if (result.code === 0) {
        req.flash('type', 'success')
        req.flash('message', `Thêm thông tin người dùng ${name} thành công`)
        res.redirect('/')
    }
    else {
        req.flash('message', result.message)
        res.redirect('/createUser')
    }
})

app.get('/detail/:id', async (req, res) => {
    let result = await userService.detailUser(req.params.id)
    res.render('detail', {result})  
})

app.post('/edit/:id', isValid, async (req, res) => {
    let data = req.body
    let {name, gender, age, email} = req.body

    //Check validation
    let errors = validationResult(req)
    if (errors.errors.length > 0) {
        req.flash('id', req.params.id)
        req.flash('edit-err', errors.errors[0].msg)
        req.flash('old-data', {name, gender, age, email})
        //To avoid refresh page again, should be use JS in front end to check data, backend just check the final validate before sending to API
        return res.redirect('/')
    }
    
    //Update data
    let result = await userService.updateUser(req.params.id, {fullName: data.name, email: data.email, age: data.age, gender: data.gender})
    if (result.code === 0) {
        req.flash('message', `Thông tin của người dùng ${data.name} cập nhật thành công`)
        req.flash('type', 'success')
    }
    else {
        req.flash('id', req.params.id)
        req.flash('edit-err', result.message)
    }
    res.redirect('/')
})

app.use((req, res) => {
    res.render('error')
})

app.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`);
});


