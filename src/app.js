import cors from "cors"
import express from "express"
import dayjs from "dayjs"
import bcrypt from 'bcrypt';
import joi from "joi"
import { v4 as uuidv4 } from 'uuid';
import connection from './database.js'

const app = express()
app.use(cors())
app.use(express.json());

const signUpSchema = joi.object({
    name: joi.string().min(1).required().trim(),
    email: joi.string().min(1).required().trim(),
    password: joi.required()
})

const signInSchema = joi.object({
    email: joi.string().min(1).required().trim(),
    password: joi.required()
})

const newEntrySchema = joi.object({
    value: joi.number().greater(1).required(),
    description: joi.string().min(1).required().trim(),
    userId: joi.number().required(),
    cashIn: joi.boolean().required()
})

app.post("/sign-up", async (req,res) =>{
    const validation = signUpSchema.validate(req.body)
    if(validation.error){
        res.sendStatus(400)
        return
    }
    try{
        const { name, email, password } = req.body;
        
        const emailRegistered = await connection.query(`
            SELECT * FROM users
            WHERE email = $1
        `,[email])

        if(emailRegistered.rows.length>0){
            res.sendStatus(409)
            return
        }

        const hash = bcrypt.hashSync(password,12)

        await connection.query(`
            INSERT INTO users
            (name, email, password)
            VALUES ($1, $2, $3)
        `,[name, email, hash])

        res.sendStatus(201)
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
})

app.post("/sign-in", async (req,res)=>{
    const validation = signInSchema.validate(req.body)
    if(validation.error){
        res.sendStatus(400)
        return
    }
    try{
        const { email, password } = req.body;
        const result = await connection.query(`
            SELECT * FROM users
            WHERE email = $1
        `,[email])

        const user=result.rows[0]
        
        if(user && bcrypt.compareSync(password, user.password)){
            await connection.query(`
                DELETE FROM sessions
                WHERE "userId" = $1
            `,[user.id])

            const token = uuidv4()

            await connection.query(`
                INSERT INTO sessions 
                ("userId", token)
                VALUES ($1, $2)
            `, [user.id, token]);
            
            const {id,name,email} = user
            
            res.send({
                token,
                user:{
                    id,
                    name,
                    email
                }
            })
            return
        }
        res.sendStatus(401)
    }catch(e){
        console.log(e)
        res.sendStatus(401)
    }
})

app.get("/wallet-history", async (req,res)=>{
    try{
        const authorization = req.headers['authorization'];
        const token = authorization?.replace('Bearer ', '');

        if(!token){
            res.sendStatus(401)
            return
        }
        const result = await connection.query(`
            SELECT *
            FROM sessions
            WHERE token = $1;
        `,[token])
        if(result.rows.length!==1){
            res.sendStatus(401)
            return
        }

        const {userId}= result.rows[0]

        const transactions = await connection.query(`
            SELECT *
            FROM transactions
            WHERE "userId" = $1;
        `,[userId])
        res.send(transactions.rows)
        return
    }catch(e){
        console.log(e)
        res.sendStatus(401)
    }
})

app.post("/transaction", async (req,res)=>{
    const validation = newEntrySchema.validate(req.body)
    if(validation.error){
        res.sendStatus(400)
        return
    }
    try{
        
        const authorization = req.headers['authorization'];
        const token = authorization?.replace('Bearer ', '');
        
        if(!token){
            
            res.sendStatus(401)
            return
        }
        
        const result = await connection.query(`
            SELECT users.id, users.name, users.email 
            FROM sessions 
            JOIN users 
            ON users.id = sessions."userId" 
            WHERE token = $1;
        `,[token])
        
        if(result.rows.length!==1){
            
            res.sendStatus(401)
            return
        }

        const { userId, value, description, cashIn } = req.body;

        await connection.query(`
            INSERT INTO transactions 
            ("userId", value, description, "cashIn", date)
            VALUES ($1, $2, $3, $4, $5)
        `, [userId, value, description, cashIn, dayjs().format("YYYY-MM-DD")]);

        res.sendStatus(201)
    }catch(e){
        console.log(e)
        res.sendStatus(401)
    }
})

app.get("/testando",(req,res)=>{
    res.sendStatus(200)
})

export default app