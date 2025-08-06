"use strict";

// Import required modules
const express = require("express");
const cors = require('cors');
const axios = require("axios");
const catalyst = require("zcatalyst-sdk-node");


const app = express();
app.use(express.json());

// Extract domain code from environment variable for Zoho region (e.g., "in", "com")
const DC = process.env['X_ZOHO_CATALYST_CONSOLE_URL'].split('.')[3]

// Environment variables for Zoho OAuth client
const AUTH_HOST = `https://accounts.zoho.${DC}/oauth/v2/token`;
const CLIENTID = process.env['CLIENTID'];
const CLIENT_SECRET = process.env['CLIENT_SECRET'];
const STRATUS_BUCKET_NAME = 'YOUR STRATUS BUCKET NAME';

const corsOptions = {
	origin: 'http://localhost:3000',
	credentials: true,
};

app.use(cors(corsOptions));

// Route to generate and store a refresh token for the current user
app.get("/generateRefreshToken", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		// Extract the authorization code from the query parameters
		const code = req.query.code;
		let userManagement = catalystApp.userManagement();
		let userDetails = await userManagement.getCurrentUser();
		// Determine domain for redirect based on environment
		const domain = `${process.env.X_ZOHO_CATALYST_IS_LOCAL === 'true' ? "http" : "https"}://${process.env.X_ZOHO_CATALYST_IS_LOCAL === 'true' ? req.headers.host : req.headers.host.split(':')[0]}`
		// Exchange the code for a refresh token
		const refresh_token = await getRefreshToken(code, res, domain);
		const userId = userDetails.user_id;
		const catalystTable = catalystApp.datastore().table("Token");
		// Insert refresh token and user ID into the table
		await catalystTable.insertRow({
			refresh_token,
			userId,
		});
		res.status(200).redirect(`${domain}/app/index.html`);
	} catch (err) {
		console.log("Error in generateRefreshToken >>> " + JSON.stringify(err));
		res.status(500).send({
			message: "Internal Server Error. Please try again after sometime.",
			error: err,
		});
	}
});

// Route to get the user ID of the currently logged-in user
app.get("/getUserDetails", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		// Fetch user details from the Token table
		const userDetails = await getUserDetails(catalystApp);
		if (userDetails.length !== 0) {
			res.status(200).send({ userId: userDetails[0].Token.userId });
		} else {
			res.status(200).send({ userId: null });
		}
	} catch (err) {
		console.log("Error in getUserDetails >>> " + err);
		res.status(500).send({
			message: "Internal Server Error in Getting User Details. Please try again after sometime.",
			error: err,
		});
	}
});

// Route to fetch all CRM products from Zoho CRM
app.get("/crmProducts", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		// Fetch the user’s refresh token details
		const userDetails = await getUserDetails(catalystApp);
		// Get the access token using refresh token
		const accessToken = await getAccessToken(catalystApp, userDetails);
		// Make an API request to Zoho CRM to get product data
		const response = await axios.get(`https://www.zohoapis.${DC}/crm/v7/Products`, {
			params: {
				fields: "id,Product_Name,Product_Code,Unit_Price,ImageUrls,Description"
			},
			headers: {
				Authorization: `Zoho-oauthtoken ${accessToken}`
			}
		});
		const rawData = response.data;
		const formattedProducts = rawData.data.map(product => (
			{
				id: product.id ? product.id : "",
				name: product.Product_Name ? product.Product_Name : "",
				code: product.Product_Code ? product.Product_Code : "",
				price: product.Unit_Price ? product.Unit_Price : 0,
				description: product.Description ? product.Description : "",
				images: product.ImageUrls ? product.ImageUrls.split(',').map(url => url.trim()) : ""
			}));
		res.status(200).json(formattedProducts);
	} catch (err) {
		console.log("Error in GET crmProducts >>> " + err);
		res.status(500).send({
			message: "Internal Server Error. Please try again after sometime.",
			error: err
		});
	}
});

// Route to fetch details of a single product by its ID
app.get("/crmProduct/:id", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		// Get the current user
		const userDetails = await getUserDetails(catalystApp);
		// Generate access token for the user
		const accessToken = await getAccessToken(catalystApp, userDetails);
		// Make API request to CRM to fetch the product by ID
		const response = await axios.get(`https://www.zohoapis.${DC}/crm/v7/Products/${req.params.id}`, {
			headers: {
				Authorization: `Zoho-oauthtoken ${accessToken}`
			}
		});
		res.status(200).json(response.data);
	} catch (err) {
		console.log(`Error in GET ${req.params.id} crmProduct >>> ` + err);
		res.status(500).send({
			message: "Internal Server Error. Please try again after sometime.",
		});
	}
});

// Route to create a new Product in Zoho CRM's Product module
app.post("/crmProduct", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		const { name, price, description, code, uploadedImageUrls } = req.body;
		// Get the current user
		const userDetails = await getUserDetails(catalystApp);
		const payload = {
			"data": [
				{
					Product_Name: name,
					Unit_Price: parseFloat(price),
					Description: description,
					Product_Code: code,
					ImageUrls: uploadedImageUrls,
					Seller_Id: userDetails[0].Token.userId
				}
			]
		};
		// Generate access token for the user
		const accessToken = await getAccessToken(catalystApp, userDetails);
		// Make Post API request to CRM to create a product in Products Module
		const response = await axios.post(
			`https://www.zohoapis.${DC}/crm/v7/Products`,
			payload,
			{
				headers: {
					Authorization: `Zoho-oauthtoken ${accessToken}`,
					"Content-Type": "application/json",
				},
			}
		);
		res.status(200).json(response.data);
	} catch (err) {
		console.log(`Error in POST crmProduct >>> ` + err);
		res.status(500).send({
			message: "Internal Server Error. Please try again after sometime.",
			error: err
		});
	}
});

// Route to update a CRM product by its ID
app.put("/crmProduct/:id", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		// Get the current user
		const userDetails = await getUserDetails(catalystApp);
		const updateData = req.body;
		const reqData = [];
		reqData.push(updateData);
		// Wrap the update object inside the 'data' key (Zoho CRM API requirement)
		const data = {
			data: reqData,
		};
		// If the request body is empty, send a 400 (Bad Request) response
		if (!updateData) {
			res.status(400).send({ message: "Update Data Not Found" });
		}
		// Generate access token for the user
		const accessToken = await getAccessToken(catalystApp, userDetails);
		// Send a PUT request to Zoho CRM API to update the product by ID
		const response = await axios.put(
			`https://www.zohoapis.${DC}/crm/v7/Products/${req.params.id}`,
			data,
			{
				headers: {
					Authorization: `Zoho-oauthtoken ${accessToken}`,
					"Content-Type": "application/json",
				},
			}
		);
		res.status(200).json(response.data);
	} catch (err) {
		console.log(`Error in PUT ${req.params.id} crmProduct >>> ` + err);
		res.status(500).send({
			message: "Internal Server Error. Please try again after sometime.",
			error: err
		});
	}
});

// Endpoint to delete a product from Zoho CRM and remove associated images from Stratus
app.delete("/crmProduct/:id", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		// Get current user details
		const userDetails = await getUserDetails(catalystApp);
		const accessToken = await getAccessToken(catalystApp, userDetails);
		// Make API request to CRM to fetch the product by ID
		const getProduct = await axios.get(`https://www.zohoapis.${DC}/crm/v7/Products/${req.params.id}`, {
			headers: {
				Authorization: `Zoho-oauthtoken ${accessToken}`
			}
		});

		const data = getProduct.data;
		// Extract ImageUrls from CRM product data that need to be deleted from Stratus
		const imageUrlsStr = data.data[0].ImageUrls;
		// Wrap the urls into Array
		const imageUrlsArray = imageUrlsStr.split(",").map(url => url.trim());
		const stratus = catalystApp.stratus();
		// Check whether the bucket is present in the Stratus
		const headBucketResponse = await stratus.headBucket(STRATUS_BUCKET_NAME);
		if (headBucketResponse) {
			// Loop through image urls and delete each one from Stratus
			imageUrlsArray.map(async url => {
				const parts = url.split(`.com/`);
				// Skip deletion for default product images which are stored in zylker-products bucket.
				if (parts[0] != "https://zylker-products-development.zohostratus") {
					let object = parts[1];
					const bucket = stratus.bucket(STRATUS_BUCKET_NAME);
					try {
						// Delete the image from Stratus
						await bucket.deleteObject(object);
					} catch (error) {
						console.log("error in delete object- ", error);
					}
				}
			})
		}
		// Delete the product from Zoho CRM using the product ID from URL
		const response = await axios.delete(
			`https://www.zohoapis.${DC}/crm/v7/Products/${req.params.id}`,
			{
				headers: {
					Authorization: `Zoho-oauthtoken ${accessToken}`,
					"Content-Type": "application/json",
				},
			}
		);
		res.status(200).json(response.data);
	} catch (err) {
		console.log(`Error in DELETE ${req.params.id} crmProduct >>> ` + err);
		res.status(500).send({
			message: "Internal Server Error. Please try again after sometime.",
			error: err
		});
	}
});

// Endpoint to save checkout order in Catalyst Data Store
app.post("/checkout", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		// Get Catalyst user details
		let userDetails = await getUserDetails(catalystApp);
		// Get order data from request body
		const { orders, address, total } = req.body;
		const catalystTable = catalystApp.datastore().table("Orders");
		// Insert the order details in Catalyst Data store
		const response = await catalystTable.insertRow({
			Orders: orders,
			Address: address,
			Total: total,
			userId: userDetails[0].Token.userId
		});
		res.status(200).send({ message: `Order placed successfully.`, orderId: response.ROWID });
	} catch (err) {
		console.log(`Error in checkout >>> ` + err);
		res.status(500).send({
			message: "Internal Server Error. Please try again after sometime.",
			error: err
		});
	}
});

// Endpoint to get all orders for the signed-in user
app.get("/getOrders", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		// Get current user info
		let userDetails = await getUserDetails(catalystApp);
		// Query all orders where userId matches current user
		let query = `Select * from Orders where Orders.userId = ${userDetails[0].Token.userId}`;
		let result = await catalystApp.zcql().executeZCQLQuery(query);
		let ordersArray = [];
		// Loop and Parse stringified order data back to JSON
		for (let i = 0; i < result.length; i++) {
			let orderData = result[i]['Orders'];
			const rawItems = orderData['Orders'];
			const fixedString = rawItems
				.replace(/([{,])\s*(\w+)\s*=/g, '$1"$2":') // quote keys
				.replace(/:\s*([^",}\]]+)(?=[,}])/g, (match, val) => {
					return isNaN(val.trim()) ? `: "${val.trim()}"` : `: ${val.trim()}`;
				});
			const items = JSON.parse(fixedString);
			let orderDetails = { orderId: orderData['ROWID'], status: orderData['Status'], items, total: orderData['Total'], createdAt: orderData['CREATEDTIME'], address: orderData['Address'] }
			ordersArray.push(orderDetails);
		}
		res.status(200).json({ data: ordersArray });
	} catch (err) {
		console.log(`Error in checkout >>> ` + err);
		res.status(500).send({
			message: "Internal Server Error. Please try again after sometime.",
			error: err
		});
	}
});

// Endpoint to fetch a specific order by its unique ID
app.get("/getOrder/:id", async (req, res) => {
	try {
		const orderId = req.params.id;
		const catalystApp = catalyst.initialize(req);
		// Query the order by Catalyst ROWID
		let query = `Select * from Orders where Orders.ROWID = ${orderId}`;
		let result = await catalystApp.zcql().executeZCQLQuery(query);
		const rawItems = result[0]['Orders']['Orders'];
		// Parse stringified order data back to JSON
		const fixedString = rawItems
			.replace(/([{,])\s*(\w+)\s*=/g, '$1"$2":') // quote keys
			.replace(/:\s*([^",}\]]+)(?=[,}])/g, (match, val) => {
				return isNaN(val.trim()) ? `: "${val.trim()}"` : `: ${val.trim()}`;
			});
		const items = JSON.parse(fixedString);
		let orderDetails = { orderId: orderId, status: result[0]['Orders']['Status'], items, total: result[0]['Orders']['Total'] }
		res.status(200).json({ data: orderDetails });
	} catch (err) {
		console.log(`Error in checkout >>> ` + err);
		res.status(500).send({
			message: "Internal Server Error. Please try again after sometime.",
			error: err
		});
	}
});

// Helper function to get a valid access token using refresh token
async function getAccessToken(catalystApp, userDetails) {
	const refresh_token = userDetails[0].Token.refresh_token;
	const userId = userDetails[0].Token.userId;
	const credentials = {
		[userId]: {
			client_id: CLIENTID,
			client_secret: CLIENT_SECRET,
			auth_url: AUTH_HOST,
			refresh_url: AUTH_HOST,
			refresh_token
		},
	};
	const accessToken = await catalystApp.connection(credentials).getConnector(userId).getAccessToken();
	return accessToken;
}

// Helper function to get Refresh Token for Zoho CRM
async function getRefreshToken(code, res, domain) {
	try {
		const url = `${AUTH_HOST}?code=${code}&client_id=${CLIENTID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&redirect_uri=${domain}/server/zylker_eclassifieds_routes_handler/generateRefreshToken`;
		const response = await axios({
			method: "POST",
			url
		});
		return response.data.refresh_token;
	} catch (err) {
		console.log("Error in getRefreshToken - ", err);
		res.status(500).send({
			message: "Internal Server Error. Please try again after sometime.",
			error: err,
		});
	}
}

// Helper function to get the logged-in user's basic details
async function getUserDetails(catalystApp) {
	let userDetails = await catalystApp.userManagement().getCurrentUser();
	// Fetches tokens from Catalyst datastore using user_id
	let userDetail = await catalystApp.zcql().executeZCQLQuery(`SELECT * FROM Token where UserId=${userDetails.user_id}`);
	return userDetail;
}

module.exports = app;