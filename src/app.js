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
            const token = uuidv4()
            await connection.query(`
                INSERT INTO sessions ("userId", token)
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

//REQUISITAR DADOS
// app.get("/posts", async (req,res) => {
//     const authorization = req.headers['authorization'];
//     const token = authorization.replace('Bearer ', '');
  
//     const user = await connection.query(`
//       SELECT * FROM sessions
//       JOIN users
//       ON sessions."userId" = users.id
//       WHERE sessions.token = $1
//     `, [token]);
  
//     // ...
//   });

app.listen(4000, ()=>{
    console.log("Server running on port 4000") 
})