const utils = require('../utils');
const axios = require('axios').default;
const logger = require('../configs/logger');

class API {
	constructor() {
		this.BASE_URI = utils.BASE_URI;
	}

	/**
	 *
	 * @param {{}} data
	 * @returns
	 */
	async sendPostRequest(data, endpoint, auth) {
		const url = `${this.BASE_URI}${endpoint}`;
		let config = {};

		if (auth) {
			config.headers = {
				Authorization: `Bearer ${auth.accessToken}`,
			};
		}

		let response;
		try {
			response = await (await axios.post(url, data, config)).data;
		} catch (error) {
			if (error.response && error.response.data) {
				response = error.response.data;
				logger.error(error.response.data);
			} else {
				response = { detail: 'An error occured!' };
				logger.error(error.message);
			}
		}

		return response;
	}

	async sendGetRequest(endpoint, auth) {
		const url = `${this.BASE_URI}/${endpoint}`;
		const config = {};

		if (auth) {
			config.headers = {
				Authorization: `Bearer ${auth.accessToken}`,
			};
		}

		let response;
		try {
			response = await (await axios.get(url, config)).data;
		} catch (error) {
			if (error.response && error.response.data) {
				response = error.response.data;
				logger.error(error.response.data);
			} else {
				response = { detail: 'An error occured!' };
				logger.error(error.message);
			}
		}

		return response;
	}

	async verifyDetails(type, number, data) {
		const url = `${
			utils.VERIFYME_BASE_URI
		}/v1/verifications/identities/${type.toLowerCase()}/${number}`;
		const config = {
			headers: {
				Authorization: `Bearer ${process.env.VERIFYME_TEST_SECRET}`,
			},
		};
		let response;
		try {
			response = await (await axios.post(url, data, config)).data;
		} catch (error) {
			if (error.response && error.response.data) {
				error.response.data.timestamp = new Date();
				response = error.response.data;
				logger.error(error.response.data);
			} else {
				console.log(error.stack);
				response = { detail: 'An error occured!' };
				logger.error(error.message);
			}
		}
		return response;
	}
}

module.exports = API;