var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import axios from 'axios';
import _isPlainObject from 'lodash/isPlainObject';
import _find from 'lodash/find';
import Qs from 'qs';

export var SearchApi = function () {
  function SearchApi() {
    _classCallCheck(this, SearchApi);
  }

  SearchApi.prototype._addAggregationsToParams = function _addAggregationsToParams(params, aggregations) {
    var newParams = _extends({}, params);
    Object.keys(aggregations).forEach(function (field) {
      aggregations[field].forEach(function (value) {
        if (!newParams.hasOwnProperty(field)) {
          newParams[field] = value;
        } else {
          newParams[field] = [].concat(newParams[field], [value]);
        }
      });
    });
    return newParams;
  };

  SearchApi.prototype._processParams = function _processParams(queryString, sortBy, sortOrder, page, size, aggregations) {
    var params = {};
    params['q'] = queryString;

    params['sortBy'] = sortBy;
    params['sortOrder'] = sortOrder;
    params['page'] = page;
    params['size'] = size;

    // if (aggregations) {
    //   params = this._addAggregationsToParams(params, aggregations);
    // }

    return params;
  };

  SearchApi.prototype.search = function search(query, apiConfig) {
    var queryString = query.queryString,
        sortBy = query.sortBy,
        sortOrder = query.sortOrder,
        page = query.page,
        size = query.size,
        aggregations = query.aggregations;

    var params = this._processParams(queryString, sortBy, sortOrder, page, size, aggregations);

    if (!apiConfig['paramSerializer']) {
      apiConfig['paramsSerializer'] = function (params) {
        return Qs.stringify(params, { arrayFormat: 'repeat' });
      };
    }
    apiConfig['params'] = _extends({}, apiConfig['params'], params);
    return axios(apiConfig);
  };

  SearchApi.prototype._serializeAggregation = function _serializeAggregation(bucket) {
    var _this = this;

    var aggregation = {
      key: bucket.key,
      total: bucket.doc_count,
      hasNestedField: false
    };

    var nestedField = _find(Object.keys(bucket), function (key) {
      return _isPlainObject(bucket[key]) && 'buckets' in bucket[key] && bucket[key].buckets.length;
    });
    if (nestedField) {
      var buckets = bucket[nestedField].buckets;
      aggregation['hasNestedField'] = nestedField;
      aggregation[nestedField] = buckets.map(function (bucket) {
        return _this._serializeAggregation(bucket);
      });
    }
    return aggregation;
  };

  SearchApi.prototype._serializeAggregations = function _serializeAggregations(aggregationsResponse) {
    var _this2 = this;

    var aggregations = {};
    Object.keys(aggregationsResponse).forEach(function (field) {
      var buckets = aggregationsResponse[field].buckets;
      aggregations[field] = buckets.map(function (bucket) {
        return _this2._serializeAggregation(bucket);
      });
    });
    return aggregations;
  };

  SearchApi.prototype.serialize = function serialize(response) {
    return {
      aggregations: this._serializeAggregations(response.aggregations || {}),
      hits: response.hits.hits,
      total: response.hits.total
    };
  };

  return SearchApi;
}();