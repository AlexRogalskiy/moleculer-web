"use strict";

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const ApiGateway = require("../../src");
const { ServiceBroker } = require("moleculer");

function setup(settings) {
	const broker = new ServiceBroker();
	broker.loadService("./test/services/test.service");

	const service = broker.createService(ApiGateway, {
		settings
	});
	const server = service.server;	

	return [broker, service, server];
}

describe("Test default settings", () => {
	let broker;
	let service;
	let server;

	beforeAll(() => {
		[ broker, service, server] = setup();
	});

	it("GET /", () => {
		return request(server)
			.get("/")
			.expect(404, "Not found")
			.then(res => {
				expect(res.body).toEqual({});
			});
	});

	it("GET /other/action", () => {
		return request(server)
			.get("/other/action")
			.expect(501)
			.expect("Content-Type", "application/json")
			.then(res => {
				expect(res.body).toEqual({
					"code": 501, 
					"message": "Action 'other.action' is not available!", 
					"name": "ServiceNotFoundError"
				});
			});
	});

	it("GET /test/hello", () => {
		return request(server)
			.get("/test/hello")
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello Moleculer");
			});
	});

	it("GET /test/greeter", () => {
		return request(server)
			.get("/test/greeter")
			.query({ name: "John" })
			.expect(200)
			.then(res => {
				expect(res.text).toBe("Hello John");
			});
	});

	it("POST /test/greeter with query", () => {
		return request(server)
			.post("/test/greeter")
			.query({ name: "John" })
			.expect(200)
			.then(res => {
				expect(res.text).toBe("Hello John");
			});
	});	

	it("POST /test/greeter with body", () => {
		return request(server)
			.post("/test/greeter")
			.send({ name: "Adam" })
			.expect(200)
			.then(res => {
				expect(res.text).toBe("Hello Adam");
			});
	});	

	it("POST /test/greeter with query & body", () => {
		return request(server)
			.post("/test/greeter")
			.query({ name: "John" })
			.send({ name: "Adam" })
			.expect(200)
			.then(res => {
				expect(res.text).toBe("Hello Adam");
			});
	});	
});

describe("Test responses", () => {
	let broker;
	let service;
	let server;

	beforeAll(() => {
		[ broker, service, server] = setup();
		broker.options.metrics = true;
	});

	it("GET /test/text with 'text/plain'", () => {
		return request(server)
			.get("/test/text")
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.header["request-id"]).toBeDefined();
				expect(res.text).toEqual("Plain text");
			});
	});

	it("GET /test/number", () => {
		return request(server)
			.get("/test/number")
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toEqual("123");
			});
	});

	it("GET /test/boolean", () => {
		return request(server)
			.get("/test/boolean")
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toEqual("true");
			});
	});

	it("GET /test/json", () => {
		return request(server)
			.get("/test/json")
			.expect(200)
			.expect("Content-Type", "application/json")
			.then(res => {
				expect(res.body).toEqual({ id: 1, name: "Eddie" });
			});
	});

	it("GET /test/jsonArray", () => {
		return request(server)
			.get("/test/jsonArray")
			.expect(200)
			.expect("Content-Type", "application/json")
			.then(res => {
				expect(res.body).toEqual([
					{ id: 1, name: "John" },
					{ id: 2, name: "Jane" }
				]);
			});
	});

	it("GET /test/buffer", () => {
		return request(server)
			.get("/test/buffer")
			.expect(200)
			.expect("Content-Type", "application/octet-stream")
			.expect("Content-Length", "15")
			.then(res => {
				expect(Buffer.from(res.body).toString("utf8")).toEqual("Buffer response");
			});
	});

	it("GET /test/bufferObj", () => {
		return request(server)
			.get("/test/bufferObj")
			.expect(200)
			.expect("Content-Type", "application/octet-stream")
			.expect("Content-Length", "22")
			.then(res => {
				expect(Buffer.from(res.body).toString("utf8")).toEqual("Buffer object response");
			});
	});

	it("GET /test/bufferJSON", () => {
		return request(server)
			.get("/test/bufferJSON")
			.expect(200)
			.expect("Content-Type", "application/json")
			.expect("Content-Length", "10")
			.then(res => {
				expect(res.body).toEqual({ a: 5 });
			});
	});

	it("GET /test/stream", () => {
		return request(server)
			.get("/test/stream")
			.expect(200)
			.expect("Content-Type", "application/octet-stream")
			.then(res => {
				expect(Buffer.from(res.body).toString("utf8")).toEqual("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis in faucibus sapien, vitae aliquet nisi. Vivamus quis finibus tortor.");
			});
	});	

	/*it("GET /test/streamWithError", () => {
		return request(server)
			.get("/test/streamWithError")
			.expect(500)
			.expect("Content-Type", "application/json")
			.then(res => {
				expect(res.body).toEqual({
					"code": 500,
					"message": "Something happened!",
					"name": "CustomError"
				});
			});
	});*/	

	it("GET /test/nothing", () => {
		return request(server)
			.get("/test/nothing")
			.expect(200)
			.then(res => {
				expect(res.text).toEqual("");
			});
	});

	it("GET /test/null", () => {
		return request(server)
			.get("/test/null")
			.expect(200)
			.then(res => {
				expect(res.text).toEqual("");
			});
	});

	it("GET /test/function", () => {
		return request(server)
			.get("/test/function")
			.expect(200)
			.expect("Content-Type", "application/json")
			.then(res => {
				expect(res.text).toEqual("");
			});
	});
});

describe("Test with `path` prefix", () => {
	let broker;
	let service;
	let server;

	beforeAll(() => {
		[ broker, service, server] = setup({
			path: "/my-api"
		});
		//broker.loadService("./test/services/math.service");
	});

	it("GET /", () => {
		return request(server)
			.get("/")
			.expect(404, "Not found");
	});

	it("GET /test/hello", () => {
		return request(server)
			.get("/test/hello")
			.expect(404, "Not found");
	});

	it("GET /my-api/test/hello", () => {
		return request(server)
			.get("/my-api/test/hello")
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello Moleculer");
			});
	});

});

describe("Test only assets", () => {
	let broker;
	let service;
	let server;

	beforeAll(() => {
		[ broker, service, server] = setup({
			assets: {
				folder: path.join(__dirname, "..", "assets")
			},
			routes: null
		});
	});

	it("GET /", () => {
		return request(server)
			.get("/")
			.expect(200)
			.expect("Content-Type", "text/html; charset=UTF-8")
			.then(res => {
				expect(res.text).toBe(fs.readFileSync(path.join(__dirname, "..", "assets", "index.html"), "utf8"));
			});		
	});

	it("GET /lorem.txt", () => {
		return request(server)
			.get("/lorem.txt")
			.expect(200)
			.expect("Content-Type", "text/plain; charset=UTF-8")
			.then(res => {
				expect(res.text).toBe("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis in faucibus sapien, vitae aliquet nisi. Vivamus quis finibus tortor.");
			});		
	});

	it("GET /test/hello", () => {
		return request(server)
			.get("/test/hello")
			.expect(404, "Not found")
			.then(res => {
				expect(res.body).toEqual({});
			});
	});	

});

describe("Test assets & API route", () => {
	let broker;
	let service;
	let server;

	beforeAll(() => {
		[ broker, service, server] = setup({
			assets: {
				folder: path.join(__dirname, "..", "assets")
			},
			routes: [{
				path: "/api"
			}]
		});
	});

	it("GET /", () => {
		return request(server)
			.get("/")
			.expect(200)
			.expect("Content-Type", "text/html; charset=UTF-8")
			.then(res => {
				expect(res.text).toBe(fs.readFileSync(path.join(__dirname, "..", "assets", "index.html"), "utf8"));
			});		
	});

	it("GET /lorem.txt", () => {
		return request(server)
			.get("/lorem.txt")
			.expect(200)
			.expect("Content-Type", "text/plain; charset=UTF-8")
			.then(res => {
				expect(res.text).toBe("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis in faucibus sapien, vitae aliquet nisi. Vivamus quis finibus tortor.");
			});		
	});

	it("GET /test/hello", () => {
		return request(server)
			.get("/api/test/hello")
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello Moleculer");
			});
	});	

});

describe("Test whitelist", () => {
	let broker;
	let service;
	let server;

	beforeAll(() => {
		[ broker, service, server] = setup({
			routes: [{
				path: "/api",
				whitelist: [
					"test.hello",
					"math.*"
				]
			}]
		});
		
		broker.loadService("./test/services/math.service");
	});

	it("GET /api/test/hello", () => {
		return request(server)
			.get("/api/test/hello")
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello Moleculer");
			});
	});	

	it("GET /api/test/greeter", () => {
		return request(server)
			.get("/api/test/greeter")
			.expect(501)
			.expect("Content-Type", "application/json")
			.then(res => {
				expect(res.body).toEqual({
					code: 501, 
					message: "Action 'test.greeter' is not available!", 
					name: "ServiceNotFoundError"
				});
			});			
	});	

	it("GET /api/math.add", () => {
		return request(server)
			.get("/api/math.add")
			.query({ a: 5, b: 8 })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("13");
			});
	});	

	it("GET /api/math.sub", () => {
		return request(server)
			.get("/api/math.sub")
			.query({ a: 5, b: 8 })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("-3");
			});
	});	
});

describe("Test alias", () => {
	let broker;
	let service;
	let server;

	beforeAll(() => {
		[ broker, service, server] = setup({
			routes: [{
				path: "/api",
				aliases: {
					"add": "math.add",
					"GET hello": "test.hello",
					"POST hello": "test.greeter"
				}
			}]
		});
		
		broker.loadService("./test/services/math.service");
	});


	it("GET /api/math.add", () => {
		return request(server)
			.get("/api/math.add")
			.query({ a: 5, b: 8 })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("13");
			});
	});


	it("GET /api/add", () => {
		return request(server)
			.get("/api/add")
			.query({ a: 5, b: 8 })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("13");
			});
	});		

	it("POST /api/add", () => {
		return request(server)
			.post("/api/add")
			.send({ a: 5, b: 8 })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("13");
			});
	});		

	it("GET /api/test/hello", () => {
		return request(server)
			.get("/api/test/hello")
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello Moleculer");
			});
	});	

	it("GET /api/hello", () => {
		return request(server)
			.get("/api/hello")
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello Moleculer");
			});
	});	

	it("POST /api/hello", () => {
		return request(server)
			.post("/api/hello")
			.query({ name: "Ben" })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello Ben");
			});		
	});	

});

describe("Test alias & whitelist", () => {
	let broker;
	let service;
	let server;

	beforeAll(() => {
		[ broker, service, server] = setup({
			routes: [{
				path: "/api",
				whitelist: [
					"math.*"
				],
				aliases: {
					"add": "math.add",
					"hello": "test.hello"
				}
			}]
		});
		
		broker.loadService("./test/services/math.service");
	});

	it("GET /api/add", () => {
		return request(server)
			.get("/api/add")
			.query({ a: 5, b: 8 })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("13");
			});
	});		

	it("GET /api/hello", () => {
		return request(server)
			.get("/api/hello")
			.expect(501)
			.expect("Content-Type", "application/json")
			.then(res => {
				expect(res.body).toEqual({
					code: 501, 
					message: "Action 'test.hello' is not available!", 
					name: "ServiceNotFoundError"
				});
			});
	});	

});

describe("Test body-parsers", () => {
	let broker;
	let service;
	let server;

	beforeAll(() => {
	});

	it("POST /api/test.gretter without bodyParsers", () => {
		[ broker, service, server] = setup({
			routes: [{
				bodyParsers: null
			}]
		});		

		return request(server)
			.post("/test.greeter")
			.send({ name: "John" })
			.expect(422)
			.expect("Content-Type", "application/json")
			.then(res => {
				/*expect(res.body).toEqual({
					"code": 422,
					"data": [{
						"field": "name",
						"message": "The 'name' field is required!",
						"type": "required"
					}],
					"message": "Parameters validation error!",
					"name": "ValidationError"
				});*/
			});
	});	

	it("POST /api/test.gretter with JSON parser", () => {
		[ broker, service, server] = setup({
			routes: [{
				bodyParsers: {
					json: true
				}
			}]
		});		

		return request(server)
			.post("/test.greeter")
			.send({ name: "John" })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello John");
			});
	});	

	it("POST /api/test.gretter with JSON parser & invalid JSON", () => {
		[ broker, service, server] = setup({
			routes: [{
				bodyParsers: {
					json: true
				}
			}]
		});		

		return request(server)
			.post("/test.greeter")
			.set("Content-Type", "application/json")
			.send("invalid")
			.expect(400)
			.expect("Content-Type", "application/json")
			.then(res => {
				expect(res.body).toEqual({
					"code": 400,
					"data": {
						"body": "invalid",
						"error": "Unexpected token i"
					},
					"message": "Invalid request body",
					"name": "InvalidRequestBodyError"
				});
			});
	});	
	

	it("POST /api/test.gretter with JSON parser & urlEncoded body", () => {
		[ broker, service, server] = setup({
			routes: [{
				bodyParsers: {
					json: true
				}
			}]
		});		

		return request(server)
			.post("/test.greeter")
			.set("Content-Type", "application/x-www-form-urlencoded")
			.send({ name: "Bill" })
			.expect(422);
	});		

	it("POST /api/test.gretter with urlencoder parser", () => {
		[ broker, service, server] = setup({
			routes: [{
				bodyParsers: {
					urlencoded: { extended: true }
				}
			}]
		});		

		return request(server)
			.post("/test.greeter")
			.set("Content-Type", "application/x-www-form-urlencoded")
			.send({ name: "Adam" })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello Adam");
			});
	});		


});


describe("Test multiple routes", () => {
	let broker;
	let service;
	let server;

	beforeAll(() => {
		[ broker, service, server] = setup({
			routes: [
				{
					path: "/api1",
					whitelist: [
						"math.*"
					],
					aliases: {
						"main": "math.add"
					}
				},
				{
					path: "/api2",
					whitelist: [
						"test.*"
					],
					aliases: {
						"main": "test.greeter"
					}
				}
			]
		});
		
		broker.loadService("./test/services/math.service");
	});

	it("GET /api1/test/hello", () => {
		return request(server)
			.get("/api1/test/hello")
			.expect(501);
	});	

	it("GET /api2/test/hello", () => {
		return request(server)
			.get("/api2/test/hello")
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello Moleculer");
			});
	});	

	it("GET /api1/math.add", () => {
		return request(server)
			.get("/api1/math.add")
			.query({ a: 5, b: 8 })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("13");
			});
	});	

	it("GET /api2/math.add", () => {
		return request(server)
			.get("/api2/math.add")
			.query({ a: 5, b: 8 })
			.expect(501);
	});	

	it("GET /api1/main", () => {
		return request(server)
			.get("/api1/main")
			.query({ a: 5, b: 8 })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("13");
			});
	});	

	it("GET /api2/main", () => {
		return request(server)
			.get("/api2/main")
			.query({ name: "Thomas" })
			.expect(200)
			.expect("Content-Type", "text/plain")
			.then(res => {
				expect(res.text).toBe("Hello Thomas");
			});
	});	
});

describe("Test lifecycle events", () => {

	it("`created` with only HTTP", () => {
		const broker = new ServiceBroker();

		const service = broker.createService(ApiGateway);
		expect(service.isHTTPS).toBe(false);
	});

	it("`created` with HTTPS", () => {
		const broker = new ServiceBroker();

		const service = broker.createService(ApiGateway, {
			settings: {
				https: {
					key: fs.readFileSync(path.join(__dirname, "..", "..", "examples", "ssl", "key.pem")),
					cert: fs.readFileSync(path.join(__dirname, "..", "..", "examples", "ssl", "cert.pem"))
				},				
			}
		});
		expect(service.isHTTPS).toBe(true);
	});
});
