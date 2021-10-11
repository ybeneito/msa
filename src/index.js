const { BaseKonnector, log, requestFactory, scrape } = require('cozy-konnector-libs')

const CozyBrowser = require('cozy-konnector-libs/dist/libs/CozyBrowser')
const browser = new CozyBrowser({
  waitDuration: '5s'
})


const request = requestFactory({
  cheerio: true,
  json: false,
  jar: true
})



const baseUrl = "https://monespaceprive.msa.fr/lfy/web/msa"

const coUrl = baseUrl + "/accueil?modalId=2"

const roleUrl = "https://monespaceprive.msa.fr/lfy/web/msa-ain-rhone/accueil?modalId=5"

const exploitant = "https://monespaceprive.msa.fr/lfy/group/espace-exploitants/mon-espace-prive"

const particulier = "https://monespaceprive.msa.fr/lfy/group/espace-particuliers/mon-espace-prive"



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
     // log('info', resp)
      return resp
    })
}

async function setRole(role){
  log('debug', role)
  const page = await browser.visit(roleUrl, {
    waitDuration: '5s'
  })
  log('debug', page)


}




