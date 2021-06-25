import supertest from "supertest"
import app from "../src/app.js"
import connection from "../src/database.js";

import {login, addingEntry} from './testLogin.js'

// describe("GET /testando", () => {
//     it("returns status 200 for valid params", async () => {
//         const result = await supertest(app).get("/testando")
//         expect(result.status).toEqual(200);
//     });
// }); 

describe("POST /sign-up", () => {
    it("should respond with status 201 when there is no user with given email", async () => {
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }

        const result = await supertest(app).post("/sign-up").send(body)

        expect(result.status).toEqual(201);
    });
    it("should respond with status 409 when there already is an user with given email", async ()=>{
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }

        await connection.query(`
            INSERT INTO users 
            (name, email, password) 
            VALUES ($1, $2, $3)
        `, [body.name, body.email, body.password]);

        const response = await supertest(app).post("/sign-up").send(body);

        expect(response.status).toEqual(409);
    })
}); 

describe("POST /sign-in", ()=>{
    it("should respond with status 200 when user exists and password is valid", async()=>{
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }
        await supertest(app).post("/sign-up").send(body);
        const response = await supertest(app).post("/sign-in").send({ email: body.email, password: body.password });

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(
            expect.objectContaining({
                token: expect.any(String)
            })
        );
    })
    it("should respond with status 401 when user exists but password is invalid", async () => {
        const body = {
          name: "Test",
          email: "test@email.com",
          password: "123456"
        };
    
        await supertest(app).post("/sign-up").send(body);
    
        const response = await supertest(app).post("/sign-in").send({ email: body.email, password: "senha_incorreta" });
    
        expect(response.status).toEqual(401);
    });
    
    it("should respond with status 401 when user doesn't exist", async () => {
        const body = {
          name: "Test",
          email: "test@email.com",
          password: "123456"
        };
    
        await supertest(app).post("/sign-up").send(body);
    
        const response = await supertest(app).post("/sign-in").send({ 
            email: "email_nao_cadastrado@email.com", 
            password: "senha_incorreta" 
        });
    
        expect(response.status).toEqual(401);
    });
})

describe("POST /transaction", () => {
    it("should respond with status 401 when token is invalid", async () => {
        const token = "token_invalido";
        const body = {
            value: 999,
            description: "testando",
            userId: 1,
            cashIn: true
        };

        const response = await supertest(app).post("/transaction").send(body).set('Authorization', `Bearer ${token}`);

        expect(response.status).toEqual(401);
    });

    it("should respond with status 400 when value is invalid", async () => {
        const token = "token_invalido";
        const body = {
            value: 0,
            description: "testando",
            userId: 1,
            cashIn: true
        };

        const response = await supertest(app).post("/transaction").send(body).set('Authorization', `Bearer ${token}`);

        expect(response.status).toEqual(400);
    });
  
    it("should respond with status 201 when body and token are valid", async () => {
        const token = await login();

        const body = {
            value: 999,
            description: "testando",
            userId: 1,
            cashIn: true
        };

        const response = await supertest(app).post("/transaction").send(body).set('Authorization', `Bearer ${token}`);

        expect(response.status).toEqual(201);
    });
});
  
// describe("GET /wallet-history", () => {
//     it("should respond with status 200", async () => {
//         const token = addingEntry()
//         const response = await supertest(app).get("/wallet-history").set('Authorization', `Bearer aaaaa`);
//         expect(response.status).toEqual(401);
//     });
// });

beforeEach(async () =>{
    await connection.query('DELETE FROM users')
    await connection.query('DELETE FROM sessions')
    await connection.query('DELETE FROM transactions')
})

afterAll(() =>{
    connection.end()
})