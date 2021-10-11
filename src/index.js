const { BaseKonnector, log, requestFactory } = require('cozy-konnector-libs')



request = requestFactory({
  cheerio: false,
  json: false
})



const baseUrl = "https://monespaceprive.msa.fr/lfy/web/msa"

const coUrl = baseUrl + "/accueil?modalId=2"

const roleLink = baseUrl + "/espace-prive?p_p_auth=wIHEuyby&p_p_id=choisirespace_WAR_z80techrwdportlet&p_p_lifecycle=0&p_p_state=exclusive&p_p_mode=view"

module.exports = new BaseKonnector(start)
  log('debug', 'hey')
  async function start(fields) {
    await authenticate(fields.login, fields.password)
    log('info', 'set role')
    await setRole(fields.role)

}

async function authenticate(username, password) {
  log('debug', 'auth')
  return request({
    method: 'POST',
    uri: coUrl,
    form: {
      _connexionauthent_WAR_z80techrwdportlet__58_login: username,
      _connexionauthent_WAR_z80techrwdportlet__58_password: password
    },
    resolveWithFullResponse: true
  })
    .catch(err => {
      log('err', err)
    })
    .then(resp => {
      log('info', resp)
      return resp
    })
}

async function setRole(role){
  log('debug', role)
  return request({
    method: 'GET',
    uri: roleLink,
    resolveWithFullResponse: true
  })
    .catch(err => {
      log('err', err)
    })
    .then(response => {
      log('info', response)
      return response
    })
}




