import cors from "cors"
import express from "express"
import pg from "pg"
import joi from "joi"
import dayjs from "dayjs"
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const {Pool} = pg

const app = express()
app.use(cors())
app.use(express.json());

const connection = new Pool({
    user: 'postgres',
    password: '123',
    host: 'localhost',
    port: 5432,
    database: 'mywallet'
})

// const categorySchema = joi.object({
//     name: joi.string().min(1).required().trim()
// })

app.get("/teste", async (req,res)=>{
    const teste=await connection.query('SELECT * FROM users')
    console.log(teste.rows)
})

app.post("/sign-up", async (req,res) =>{
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
    try{
        const { email, password } = req.body;
        const result = await connection.query(`
            SELECT * FROM users
            WHERE email = $1
        `,[email])

        const user=result.rows[0]
        
        if(user && bcrypt.compareSync(password, user.password)){
            console.log()
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
        console.log(token)
        if(!token){
            sendStatus(401)
            return
        }
        const result = await connection.query(`
            SELECT *
            FROM sessions
            WHERE token = $1;
        `,[token])
        console.log(result)
        if(result.rows.length!==1){
            sendStatus(401)
            return
        }

        const {userId}= result.rows[0]

        const transactions = await connection.query(`
            SELECT *
            FROM transactions
            WHERE "userId" = $1;
        `,[userId])
        console.log(transactions.rows)
        res.send(transactions.rows)
        return
    }catch(e){
        console.log(e)
        res.sendStatus(401)
    }
})

app.post("/transaction", async (req,res)=>{
    try{
        const authorization = req.headers['authorization'];
        const token = authorization?.replace('Bearer ', '');
        if(!token){
            sendStatus(401)
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
            sendStatus(401)
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

app.listen(4000, ()=>{
    console.log("Server running on port 4000") 
})