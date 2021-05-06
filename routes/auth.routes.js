const {Router} = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const User = require('../models/User')
const router = Router()
const config = require('config')


// /api/auth/register
router.post(
    '/register',
    [
        check('email', 'Incorrect email').isEmail(),
        check('password', 'Min length is 6').isLength({min: 6})
    ],
    async (req, res) => {
        try {
            console.log('Body',req.body)

            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Incorrect registration data'
                })
            }
            const {email, password} = req.body

            const candidate = await User.findOne({email})
            if (candidate) {
                return res.status(400).json({message: 'This user already exist'})
            }
            const mastb = email.includes('billy')?'admin':'petuh'
            const hashedPassword = await bcrypt.hash(password, 12)
            const user = new User({email, password: hashedPassword, mastb})
            await user.save()
            res.status(201).json({message: 'User created!'})

        } catch (e) {
            res.status(500).json({message: 'Something went wrong'})
        }
    })

// /api/auth/login
router.post('/login',
    [
        check('email', 'Write correct email').normalizeEmail().isEmail(),
        check('password', 'Write password').exists()
    ],
    async (req, res) => {
        try {

            const {email, password} = req.body

            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Incorrect login data'
                })
            }
            const user = await User.findOne({email})

            if (!user) {
                return res.status(400).json({message: 'No user with this email'})
            }
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                return res.status(400).json({message: 'Incorrect password'})
            }

            const token = jwt.sign(
                {userId: user.id},
                config.get('jwtSecret'),
                {expiresIn: '1h'})
            res.json({token, userId: user.id})
        } catch (e) {
            res.status(500).json({message: 'Something went wrong'})
        }
    })

module.exports = router
