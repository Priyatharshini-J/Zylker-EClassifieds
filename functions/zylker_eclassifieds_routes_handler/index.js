"use strict";

const express = require("express");
const cors = require('cors');
const app = express();
app.use(express.json());

const axios = require("axios");
const catalyst = require("zcatalyst-sdk-node");

const AUTH_HOST = "https://accounts.zoho.com/oauth/v2/token";
const CLIENTID = process.env['CLIENTID'];
const CLIENT_SECRET = process.env['CLIENT_SECRET'];
const STRATUS_BUCKET_NAME = 'YOUR BUCKET NAME';

const corsOptions = {
	origin: 'http://localhost:3000',
	credentials: true,
};

app.use(cors(corsOptions));

app.get("/generateRefreshToken", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		const code = req.query.code;
		let userManagement = catalystApp.userManagement();
		let userDetails = await userManagement.getCurrentUser();
		const domain = `${process.env.X_ZOHO_CATALYST_IS_LOCAL === 'true' ? "http" : "https"}://${process.env.X_ZOHO_CATALYST_IS_LOCAL === 'true' ? req.headers.host : req.headers.host.split(':')[0]}`
		const refresh_token = await getRefreshToken(code, res, domain);
		const userId = userDetails.user_id;
		const catalystTable = catalystApp.datastore().table("Token");
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

app.get("/getUserDetails", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
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

app.get("/crmProducts", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		const userDetails = await getUserDetails(catalystApp);
		const accessToken = await getAccessToken(catalystApp, userDetails);
		const response = await axios.get("https://www.zohoapis.com/crm/v7/Products", {
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

app.get("/crmProduct/:id", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		const userDetails = await getUserDetails(catalystApp);
		const accessToken = await getAccessToken(catalystApp, userDetails);
		const response = await axios.get(`https://www.zohoapis.com/crm/v7/Products/${req.params.id}`, {
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

app.post("/crmProduct", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		const { name, price, description, code, uploadedImageUrls } = req.body;


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
		const accessToken = await getAccessToken(catalystApp, userDetails);
		const response = await axios.post(
			"https://www.zohoapis.com/crm/v7/Products",
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

app.put("/crmProduct/:id", async (req, res) => {

	try {
		const catalystApp = catalyst.initialize(req);
		const userDetails = await getUserDetails(catalystApp);
		const updateData = req.body;
		const reqData = [];
		reqData.push(updateData);

		const data = {
			data: reqData,
		};
		if (!updateData) {
			res.status(400).send({ message: "Update Data Not Found" });
		}

		const accessToken = await getAccessToken(catalystApp, userDetails);
		const response = await axios.put(
			`https://www.zohoapis.com/crm/v7/Products/${req.params.id}`,
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

app.delete("/crmProduct/:id", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		const userDetails = await getUserDetails(catalystApp);
		const accessToken = await getAccessToken(catalystApp, userDetails);

		/* Temporarily commenting out Stratus delete since it's not working in the new project
		
		const getProduct = await axios.get(`https://www.zohoapis.com/crm/v7/Products/${req.params.id}`, {
			headers: {
				Authorization: `Zoho-oauthtoken ${accessToken}`
			}
		});

		const data = getProduct.data;
		const imageUrlsStr = data.data[0].ImageUrls;
		const imageUrlsArray = imageUrlsStr.split(",").map(url => url.trim());
		const stratus = catalystApp.stratus();
		const headBucketResponse = await stratus.headBucket(STRATUS_BUCKET_NAME);
		if (headBucketResponse) {
			imageUrlsArray.map(async url => {
				const parts = url.split(".com/");
				let object = parts[1];
				const bucket = stratus.bucket(STRATUS_BUCKET_NAME);
				try {
					await bucket.deleteObject(object);
				} catch (error) {
					console.log("error in delete object- ", error);
				}
			})
		} */

		const response = await axios.delete(
			`https://www.zohoapis.com/crm/v7/Products/${req.params.id}`,
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

app.post("/checkout", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		let userDetails = await getUserDetails(catalystApp);
		const { orders, address, total } = req.body;
		const catalystTable = catalystApp.datastore().table("Orders");
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

app.get("/getOrders", async (req, res) => {
	try {
		const catalystApp = catalyst.initialize(req);
		let userDetails = await getUserDetails(catalystApp);
		let query = `Select * from Orders where Orders.userId = ${userDetails[0].Token.userId}`;
		let result = await catalystApp.zcql().executeZCQLQuery(query);
		let ordersArray = [];
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

app.get("/getOrder/:id", async (req, res) => {
	try {
		const orderId = req.params.id;
		const catalystApp = catalyst.initialize(req);
		let query = `Select * from Orders where Orders.ROWID = ${orderId}`;
		let result = await catalystApp.zcql().executeZCQLQuery(query);
		const rawItems = result[0]['Orders']['Orders'];
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

async function getAccessToken(catalystApp, userDetails) {
	console.log("")
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

async function getUserDetails(catalystApp) {
	let userDetails = await catalystApp.userManagement().getCurrentUser();
	let userDetail = await catalystApp.zcql().executeZCQLQuery(`SELECT * FROM Token where UserId=${userDetails.user_id}`);
	return userDetail;
}

module.exports = app;