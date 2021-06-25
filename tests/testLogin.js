import supertest from 'supertest';

import app from '../src/app.js';

export async function login () {
    await supertest(app).post("/sign-up").send({ 
        name: 'Test', 
        email: 'test@email.com', 
        password: '123456' 
    });

    const user = await supertest(app).post("/sign-in").send({ 
        email: 'test@email.com', 
        password: '123456' 
    });

    return user.body.token;
}

export async function addingEntry () {
    const token = login();const body = {
        value: 999,
        description: "testando",
        userId: 1,
        cashIn: true
    };
    await supertest(app).post("/transaction").send(body).set('Authorization', `Bearer ${token}`);
    return token;
}