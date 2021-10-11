const { BaseKonnector, log, requestFactory, scrape } = require('cozy-konnector-libs')


const request = requestFactory({
  cheerio: true,
  json: false,
  jar: true
})



const baseUrl = "https://monespaceprive.msa.fr/lfy/web/msa"

const coUrl = baseUrl + "/accueil?modalId=2"

const roleLink = baseUrl + "/accueil?modalId=5"

module.exports = new BaseKonnector(start)
  log('debug', 'hey')
  async function start(fields) {
    await authenticate(fields.login, fields.password)
    log('info', 'set role')
    await setRole(fields.role)

}

async function authenticate(username, password) {
  log('debug', 'auth')
  const $ = await request({
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
      return resp
    })
}

async function setRole(role){
  log('debug', role)
  const $ = await request({
    method: 'GET',
    uri: roleLink,
    resolveWithFullResponse: true
  })
  .catch(err => {
    log('err', err)
  })
  .then(resp => {
    log('info', resp)
  })


}




