import supertest from "supertest"
import app from "../src/app.js"

describe("GET /testando", () => {
    it("returns status 200 for valid params", async () => {
        const result = await supertest(app).get("/testando")
        expect(result.status).toEqual(200);
    });
}); 

describe("POST /sign-up", () => {
    it("returns status 200 when there is no user with the given email", async () => {
        const body = {
            name:"Roger",
            email:"roger@roger.com.br",
            password:"123456"
        }
        const result = await supertest(app).post("/sign-up")

        expect(result.status).toEqual(201);
    });
}); 