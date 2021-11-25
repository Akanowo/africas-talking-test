const uniqid = require('uniqid');
const logger = require('./configs/logger');
const Session = require('./models/session');
const utils = require('./utils');
const API = require('./utils/api');

const api = new API();

class Menu {
	constructor(phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	authenticatedMenu(res) {
		const text = `CON Choose an option
		1. Wallet
		2. Thrift Savings
		3. Raise a fund
		4. Report an issue`;

		utils.sendResponse(res, text);
	}

	walletMenu(req, res, textArray) {
		const count = textArray.length;
		if (count === 1) {
			const text = `CON Choose an option
			1. Transfer to Wallx
			2. Transfer to Bank
			3. Buy Airtime
			4. Get Wallet Balance
			98. Go Back
			99. Go To Main Menu`;
			utils.sendResponse(res, text);
		} else {
			if (textArray[1] === '1') {
				this.collectTransferToWallxFields(req, res, textArray);
			} else if (textArray[1] === '2') {
				utils.sendResponse(res, `END To be implemented`);
			} else if (textArray[1] === '3') {
				this.collectBuyAirtimeFields(req, res, textArray);
			} else if (textArray[1] === '4') {
				// send sms to user
				utils.sendResponse(res, `END An SMS would be sent to you`);
			} else {
				utils.sendResponse(res, `END Invalid Choice`);
			}
		}
	}

	async collectTransferToWallxFields(req, res, textArray) {
		const count = textArray.length;
		if (count === 2) {
			utils.sendResponse(res, `CON Enter reciever wallet id`);
		}

		if (count === 3) {
			utils.sendResponse(res, `CON Enter amount`);
		}

		if (count === 4) {
			utils.sendResponse(res, `CON Enter wallet pin`);
		}

		if (count === 5) {
			const data = {
				userID: '128',
				recieverwalletId: textArray[2],
				amount: textArray[3],
				walletpin: textArray[4],
				description: '',
				transactiontype: 'wallet',
				commission: '50',
				currency: 'NGN',
			};

			const response = await api.sendPostRequest(
				data,
				'/customertransaction/',
				req.authentication
			);
			logger.info(response);
			if (response.status) {
				utils.sendResponse(res, `END ${response.message}`);
				utils.terminateSession(req.body.sessionId);
				// TODO: send sms
			} else {
				utils.sendResponse(res, `END ${response.message}`);
				utils.terminateSession(req.body.sessionId);
			}
		}
	}

	async collectBuyAirtimeFields(req, res, textArray) {
		const count = textArray.length;
		if (count === 2) {
			utils.sendResponse(res, `CON Enter phone number, eg 070xxxx`);
		}

		if (count === 3) {
			utils.sendResponse(res, `CON Enter amount`);
		}

		if (count === 4) {
			const data = {
				userID: '1',
				country: 'NG',
				customer: `234${textArray[2]}`,
				amount: Number.parseInt(textArray[3]),
				recurrence: 'ONCE',
				biller_name: 'AIRTIME',
				reference: 'rave-16141368372',
				userID: 1,
				method: 'wallet',
			};

			const response = await api.sendPostRequest(
				data,
				'/purchasebill/',
				req.authentication
			);
			if (response.status) {
				utils.sendResponse(res, `END ${response.message}`);
				logger.info(response);
				utils.terminateSession(req.body.sessionId);
				// TODO: send sms
			} else {
				utils.sendResponse(res, `END ${response.message}`);
				logger.info(response);
				utils.terminateSession(req.body.sessionId);
			}
		}
	}

	thriftSavingsMenu(req, res) {
		utils.terminateSession(req.body.sessionId);
		utils.sendResponse(res, `END To be implemented`);
	}

	async raiseAFundMenu(req, res, textArray) {
		const count = textArray.length;
		let text = '';

		if (count === 1) {
			text = `CON Enter Campaign id`;
			utils.sendResponse(res, text);
		}

		if (count === 2) {
			// get campaign details
			const apiResult = await api.sendGetRequest(
				`/crowdcontributionmodule/?id=${textArray[1]}`,
				req.authentication
			);
			if (!apiResult.status) {
				utils.sendResponse(res, `END ${apiResult.detail}`);
				utils.terminateSession(req.body.sessionId);
				return;
			}
			const campaign = apiResult.data[0];
			text = `CON Group Name: ${campaign.groupname.toUpperCase()}
			1. Donate
			2. Check contribution status`;
			utils.sendResponse(res, text);
		}

		if (count === 3) {
			if (textArray[2] === '1') {
				// donate
				utils.sendResponse(res, `CON Enter amount`);
			} else if (textArray[2] === '2') {
				// contribution status
				const apiResult = await api.sendGetRequest(
					`/crowdcontributionmodule/?id=${textArray[1]}`,
					req.authentication
				);
				if (!apiResult.status) {
					utils.sendResponse(res, `END ${apiResult.detail}`);
					utils.terminateSession(req.body.sessionId);
					return;
				}
				const campaign = apiResult.data[0];
				text = `END Group Name: ${campaign.groupname.toUpperCase()}
				Creator: ${campaign.creatorname}
				Description: ${campaign.groupdecription}
				Start date: ${campaign.startdate}
				End date: ${campaign.enddate}
				Amount per person: ${campaign.amountperperson}
				Total Contributions: ${campaign.totalcontribution}`;
				utils.sendResponse(res, text);
				utils.terminateSession(req.body.sessionId);
			} else {
				// invalid choice
				utils.terminateSession(req.body.sessionId);
				utils.sendResponse(res, `END Invalid choice`);
			}
		}

		if (count === 4) {
			const apiResult = await api.sendGetRequest(
				`/crowdcontributionmodule/?id=${textArray[1]}`,
				req.authentication
			);
			if (!apiResult.status) {
				utils.sendResponse(res, `END ${apiResult.detail}`);
				utils.terminateSession(req.body.sessionId);
				return;
			}
			const campaign = apiResult.data[0];
			text = `CON Group Name: ${campaign.groupname.toUpperCase()}
			Amount: ${textArray[3]}
			
			Enter wallet pin`;
			utils.sendResponse(res, text);
		}

		if (count === 5) {
			// send request
			const data = {
				groupID: textArray[1],
				memberID: 1,
				walletpin: textArray[4],
				amount: Number.parseInt(textArray[2]),
				transactionreference: uniqid(),
				transactiondate: `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`,
				paymentmethod: 'wallet',
				currency: 'NGN',
			};

			const response = await api.sendPostRequest(
				data,
				'/contributiontransaction/',
				req.authentication
			);
			if (!response.status) {
				utils.sendResponse(
					res,
					`END ${response.detail || response.message || 'An error occured'}`
				);
				utils.terminateSession(req.body.sessionId);
				return;
			}

			utils.sendResponse(res, `END Transaction successful`);
			utils.terminateSession(req.body.sessionId);
		}
	}

	reportIssueMeu(req, res, textArray) {
		const options = { 1: 'BVN', 2: 'NIN' };
		const count = textArray.length;
		let text;

		if (count === 1) {
			text = `CON Register with
			1. BVN
			2. NIN`;
			utils.sendResponse(res, text);
		}

		if (count == 2) {
			// verify bvn or nin and fetch user details
		}

		utils.terminateSession(req.body.sessionId);
		utils.sendResponse(res, `END To be implemented`);
	}

	registerMenu(req, res) {
		utils.terminateSession(req.body.sessionId);
		utils.sendResponse(res, `END To be implemented`);
	}

	/**
	 *
	 * @param {Array<string>} textArray
	 * @returns
	 */
	async loginMenu(textArray, req, res) {
		const count = textArray.length;
		const { sessionId, phoneNumber } = req.body;

		if (count === 1) {
			utils.sendResponse(res, `CON Enter your username`);
			return;
		} else if (count === 2) {
			utils.sendResponse(res, `CON Enter your password`);
			return;
		} else if (count === 3) {
			const data = {
				username: textArray[1],
				password: textArray[2],
			};

			const response = await api.sendPostRequest(
				data,
				'/api/token/',
				req.authentication
			);

			if (response.access && response.refresh) {
				// update session
				const updatedSession = await Session.findOneAndUpdate(
					{ sessionId, phoneNumber },
					{ accessToken: response.access, refreshToken: response.refresh },
					{ runValidators: true, new: true }
				);

				if (updatedSession) {
					utils.sendResponse(res, `CON 99. Go to main menu`);
					return;
				} else {
					utils.sendResponse(res, `END An error occured! Please try again`);
				}
			}

			utils.sendResponse(res, `END ${response.detail || `An error occured`}`);
		}
	}

	middleware(text) {
		return this.goBack(this.goToMainMenu(text));
	}

	/**
	 *
	 * @param {string} text
	 */
	goBack(text) {
		// split text
		let splitText = text.split('*');
		while (splitText.find((x) => x === utils.GO_BACK)) {
			// get index of go back string
			const goBackTextIndex = splitText.findIndex((x) => x === utils.GO_BACK);

			// remove from array
			splitText.splice(goBackTextIndex, 1);
		}

		return splitText.join('*');
	}

	/**
	 *
	 * @param {string} text
	 */
	goToMainMenu(text) {
		// split text
		let splitText = text.split('*');

		// get index of go to main menu string
		for (let choice of splitText) {
			if (choice === utils.GO_TO_MAIN_MENU) {
				const choiceIndex = splitText.findIndex((x) => x === choice);
				splitText.splice(0, choiceIndex + 1);
			}
		}
		return splitText.join('*');
	}
}

module.exports = Menu;
