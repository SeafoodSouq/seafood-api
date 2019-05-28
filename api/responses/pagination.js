/**
 * pagination.js
 *
 * A custom response.
 *
 * Example usage:
 * ```
 *     return res.pagination();
 *     // -or-
 *     return res.pagination(optionalData);
 * ```
 *
 * Or with actions2:
 * ```
 *     exits: {
 *       somethingHappened: {
 *         responseType: 'pagination'
 *       }
 *     }
 * ```
 *
 * ```
 *     throw 'somethingHappened';
 *     // -or-
 *     throw { somethingHappened: optionalData }
 * ```
 */

module.exports = function pagination(optionalData) {

  // Get access to `req` and `res`
  var req = this.req;
  var res = this.res;

  // Define the status code to send in the response.
  var statusCodeToSet = 200;

  // If no data was provided, use res.sendStatus().
  if (optionalData === undefined) {
    sails.log.info('Ran custom response: res.pagination()');
    return res.sendStatus(statusCodeToSet);
  }
  // Else if the provided data is an Error instance, if it has
  // a toJSON() function, then always run it and use it as the
  // response body to send.  Otherwise, send down its `.stack`,
  // except in production use res.sendStatus().
  else if (_.isError(optionalData)) {
    sails.log.info('Custom response `res.pagination()` called with an Error:', optionalData);

    // If the error doesn't have a custom .toJSON(), use its `stack` instead--
    // otherwise res.json() would turn it into an empty dictionary.
    // (If this is production, don't send a response body at all.)
    if (!_.isFunction(optionalData.toJSON)) {
      if (process.env.NODE_ENV === 'production') {
        return res.sendStatus(statusCodeToSet);
      }
      else {
        return res.status(statusCodeToSet).send(optionalData.stack);
      }
    }
  }
  // Set status code and send response data.
  else {
    //Para calcular la cantidad de paginas disponibles
    let length = optionalData.totalResults / optionalData.limit;
    if (length < 0) {
        length = 0;
    } else if (length % 1 !== 0) {
        length = parseInt(length.toString());
        length += 1
    };

    let resData = {
      message: "ok",
      totalResults: optionalData.totalResults,
      page: optionalData.page,
      pageSize: optionalData.datas.length,
      data: optionalData.datas,
      pageAvailables: length
    };
    return res.status(statusCodeToSet).send(resData);
  }

};
