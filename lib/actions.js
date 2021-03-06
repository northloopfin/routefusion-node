const axios = require('axios');
const auth = require('./auth');
const config = require('../lib/config');
let _config;

module.exports = function (config) {
  // set global config
  _config = config || {};

  return {
    // USERS
    getUser: function () {
      return reqInstance('GET', '/users/me')
    },

    updateUser: function (body) {
      return reqInstanceWithBody('PUT', '/users/me', body);
    },

    // MASTER USERS
    getUserByUuid: function (userUuid) {
      return reqInstance('GET', `/users/me/users/${userUuid}`)
    },

    getUsers: function () {
      return reqInstance('GET', '/users/me/users/')
    },

    updateUserByUuid: function (userUuid, body) {
      return reqInstanceWithBody('PUT', `/users/me/users/${userUuid}`, body)
    },

    createUserByUuid: function (body) {
      return reqInstanceWithBody('POST', '/users/me/users/', body)
    },

    // BENEFICIARIES

    getBeneficiaries: function (paginationOpts) {
      return reqInstanceWithPagination('GET', '/beneficiaries', paginationOpts);
    },

    getBeneficiary: function (id) {
      return reqInstance('GET', `/beneficiaries/${id}`);
    },

    createBeneficiary: function (body) {
      return reqInstance('POST', '/beneficiaries', body);
    },

    updateBeneficiary: function (id, body) {
      return reqInstance('PUT', `/beneficiaries/${id}`, body);
    },

    // MASTER sub-user beneficiaries

    getBeneficiariesForUser: function (userUuid, paginationOpts) {
      return reqInstanceWithPagination('GET', `/users/${userUuid}/beneficiaries`, paginationOpts);
    },

    getBeneficiaryForUser: function (userUuid, id) {
      return reqInstance('GET', `/users/${userUuid}/beneficiaries/${id}`);
    },

    createBeneficiaryForUser: function (userUuid, body) {
      return reqInstance('POST', `/users/${userUuid}/beneficiaries`, body);
    },

    updateBeneficiaryForUser: function (userUuid, id, body) {
      return reqInstance('PUT', `/users/${userUuid}/beneficiaries/${id}`, body);
    },

    // TRANSFERS

    createTransfer: function (body) {
      return reqInstance('POST', '/transfers', body);
    },

    getTransfer: function (transferUuid) {
      return reqInstance('GET', `/transfers/${transferUuid}`);
    },

    getAllTransfers: function (paginationOpts) {
      return reqInstanceWithPagination('GET', '/transfers', paginationOpts);
    },

    getTransferStatus: function (transferUuid) {
      return reqInstance('GET', `/transfers/${transferUuid}/status`)
    },

    cancelTransfer: function (transferUuid) {
      return reqInstance('DELETE', `/transfers/${transferUuid}/cancel`);
    },

    // MASTER TRANSFERS

    createTransferForUser: function (userUuid, body) {
      return reqInstance('POST', `/users/${userUuid}/transfers`, body);
    },

    getTransferForUser: function (userUuid, transferUuid) {
      return reqInstance('GET', `/users/${userUuid}/transfers/` + transferUuid);
    },

    getAllTransfersForUser: function (userUuid, paginationOpts) {
      return reqInstanceWithPagination('GET', `/users/${userUuid}/transfers`, paginationOpts);
    },

    getTransferStatusForUser: function (userUuid, transferUuid) {
      return reqInstance('GET', `/users/${userUuid}/transfers/${transferUuid}/status`)
    },

    cancelTransferForUser: function (userUuid, transferUuid) {
      return reqInstance('DELETE', `/users/${userUuid}/transfers/${transferUuid}/cancel`);
    },

    getBalance: function () {
      return reqInstance('GET', '/balance');
    },

    // QUOTES

    createQuote: function (body) {
      return reqInstance('POST', '/quotes', body);
    },

    /**
     * Retreive a previously created quote
     * @param {string} quoteUuid
     */
    getQuote: function (quoteUuid) {
      return reqInstance('GET', '/quotes/' + quoteUuid);
    },

    // VERIFY
    sendComplianceData: function (body, userUuid) {
      return reqInstance('POST', `/users/${userUuid}/compliance`, body);
    },

    submitComplianceData: function (userUuid) {
      return reqInstance('POST', `/users/${userUuid}/compliance/submit`);
    },
    // sendVerificationData: function (body, userUuid) {
    //   return reqInstance('POST', '/users/' + userUuid + '/verify', body);
    // },

    // getVerificationData: function (userUuid) {
    //   return reqInstance('GET', '/users/' + userUuid + '/verify');
    // },

    // updateVerificationData: function (body, userUuid) {
    //   return reqInstanceWithBody('PUT', '/users/' + userUuid + '/verify', body);
    // },

    // deleteVerificationData: function (userUuid) {
    //   return reqInstance('DELETE', '/users/' + userUuid + '/verify');
    // },

    // Webhooks
    createWebhook: function (body) {
      return reqInstance('POST', '/webhooks', body);
    },

    updateWebhook: function (uuid, body) {
      return reqInstance('PUT', '/webhooks/' + uuid, body);
    },

    getWebhook: function (uuid) {
      return reqInstance('GET', '/webhooks/' + uuid);
    },

    getWebhooks: function () {
      return reqInstance('GET', '/webhooks');
    },

    deleteWebhooks: function (uuid) {
      return reqInstance('DELETE', '/webhooks/' + uuid);
    },
  };
};


// PRIVATE

function reqInstance(method, path, data) {
  let request = axios.create({
    baseURL: _config.RF_BASE_URL + '/v1',
    headers: {
      'client-id': _config.RF_CLIENT_ID,
      'signature': auth.createDigest(path, data, _config.RF_SECRET)
    }
  });
  switch (method) {
    case 'GET':
    case 'get':
      request = request.get(path);
      break;
    case 'PUT':
    case 'put':
      request = request.put(path, data);
      break;
    case 'POST':
    case 'post':
      request = request.post(path, data);
      break;
    case 'PATCH':
    case 'patch':
      request = request.patch(path, data);
      break;
    case 'DELETE':
    case 'delete':
      request = request.delete(path)
      break;
  }
  return request
    .then(function (resp) {
      return resp.data;
    })
    .catch(function (err) {
      return handleError(err);
    })
}

function reqInstanceWithBody(method, path, data) {
  // check data is not null, not an array, is a valid object
  if (data !== null && !(data instanceof Array) && typeof data !== 'object') {
    return Promise.reject(function () {
      throw Error('body must be an object');
    });
  }
  return reqInstance(method, path, data);
}

function reqInstanceWithPagination(method, path, paginationOpts) {
  if (!paginationOpts || typeof paginationOpts !== 'object') return reqInstance(method, path);

  const { limit, offset = 0, orderBy } = paginationOpts;
  let { order } = paginationOpts;
  let pathWithPagination = `${path}?limit=${limit}&offset=${offset}`;

  if (orderBy && typeof orderBy === 'string') pathWithPagination += `&orderBy=${orderBy}`;
  if (order && order.toUpperCase() !== 'DESC') order = 'ASC';

  pathWithPagination += `&order=${order}`;

  return reqInstance(method, pathWithPagination);
}

function handleError(err) {
  if (err.response && err.response.data) return err.response.data;
  if (err.message) return err.message;
  if (err.error) return err.error;
}