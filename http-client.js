import axios from 'axios'
import $ from 'n-zepto'
import { ENV, Msg, Tools } from './tools'
import router from '../router'
import i18n from '../lang/index'

const CONTENT_TYPE = {
  json: 'application/json;',
  form: 'application/x-www-form-urlencoded;',
  html: 'text/html;',
  file: 'multipart/form-data'
}
const HEADERS = {
  lang: 'Accept-Language'
}
const CONTENT_TYPE_KEY = 'Content-Type'
const protocol = location.protocol
export const API_URL = `${protocol}//${ENV.VUE_APP_API_DOMAIN}/${ENV.VUE_APP_API_CONTEXT}`
export const BaseUrl = `${protocol}//${ENV.VUE_APP_API_DOMAIN}/`
const $t = i18n.messages[Tools.getLang().value]

// export const API_UPLOAD_URL = `${API_URL}mgr/upload?type=0` + (ENV.DEBUG ? `&${ENV.DEBUG_STR}` : '');

function checkResponse (response) {
  let contentType = response.headers['content-type']
  Msg.hideLoading()
  if (response.status === 200) {
    if (contentType.indexOf(CONTENT_TYPE.html) !== -1) {
      return response.text
    }

    if (contentType.indexOf(CONTENT_TYPE.json) !== -1) {
      let result = response.data ? response.data : JSON.parse(response.request.responseText)
      // if (result.code !== 0) {
      if (result.code !== '0' && result.code !== 0) {
        Msg.alert(result.msg, () => {
          if (result.code === '000000000010') {
            Tools.setRedictUrl(`${window.location.href}#back=true`)
            router.push('/identityLogin')
            return false
          }
        })
        // alert(result.msg);
        return false
      } else {
        return result.data || result.result
        // return result.result;
      }
    }
  } else {
    Msg.alert($t.httpClient.errorMsg, `${response.status} ${response.statusText}`)
  }
}

axios.defaults.withCredentials = true
axios.interceptors.response.use(checkResponse, (error) => {
  // Do something with response error
  Msg.hideLoading()
  if (error.message === 'Network Error' && ENV.DEBUG) {
    Msg.alert($t.httpClient.errorMsg, error)
  }
  return Promise.reject(error)
})

export class HttpClient {
  static call (url, { method = 'get', headers = {}, body = null, mask = true, postData = false, external = false } = {}) {
    url = external ? url : API_URL + url
    if (url.indexOf('?') === -1) {
      url += '?'
    } else {
      url += '&'
    }
    url += `_t=${new Date().getTime()}`

    let params = {
      baseURL: API_URL,
      method: method,
      url: url,
      responseType: 'json',
      headers: Object.assign(headers, {
        [HEADERS.lang]: Tools.getLang().value
      })
    }

    if (method === 'get') {
      params.params = body
    } else {
      params.data = postData ? body : $.param(body)
    }
    if (mask) {
      Msg.loading()
    }
    return axios(params).catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)
        Msg.alert(`${$t.httpClient.systemError}:${error.response.status}`)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request)
        Msg.alert(`${$t.httpClient.systemError}`)
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message)
        Msg.alert(`${$t.httpClient.systemError}：${error.message}`)
      }
      // console.log(error.config)
    })
  }

  static get (url, { mask = true, external = false, headers = {} } = {}) {
    return HttpClient.call(url, {
      headers,
      external,
      mask
    })
  }

  static post (url, { body = {}, method = 'post', mask = true, postData = false, external = true, headers = {} } = {}) {
    return HttpClient.call(url, {
      method,
      headers: Object.assign(headers, {
        [CONTENT_TYPE_KEY]: CONTENT_TYPE.form
      }),
      body,
      external,
      postData,
      mask
    })
  }

  static put (url, { body = {}, mask = true, postData = false, external = false, headers = {} } = {}) {
    return HttpClient.post(url, { body, method: 'put', postData, external, mask, headers })
  }

  static destroy (url, { body = {}, mask = true, postData = false, external = false, headers = {} } = {}) {
    return HttpClient.post(url, { body, method: 'delete', postData, external, mask, headers })
  }

  static postBody (url, { body = {}, method = 'post', mask = true, postData = true, external = false, headers = {} }) {
    return HttpClient.call(url, {
      method,
      headers: Object.assign(headers, {
        [CONTENT_TYPE_KEY]: CONTENT_TYPE.json
      }),
      body,
      postData,
      external,
      mask
    })
  }

  static upload (url, { body = {}, method = 'post', mask = true, postData = true, external = false, headers = {} }) {
    return HttpClient.call(url, {
      method,
      headers: Object.assign(headers, {
        [CONTENT_TYPE_KEY]: CONTENT_TYPE.file
      }),
      body,
      postData,
      external,
      mask
    })
  }
}
