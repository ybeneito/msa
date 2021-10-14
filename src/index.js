const { BaseKonnector, log, requestFactory, scrape } = require('cozy-konnector-libs')

const CozyBrowser = require('cozy-konnector-libs/dist/libs/CozyBrowser')
const signin = require('cozy-konnector-libs/dist/libs/signin')
const browser = new CozyBrowser({
  waitDuration: '5s'
})


const request = requestFactory({
  cheerio: true,
  json: false,
  jar: true,
  debug: true
})



const baseUrl = "https://monespaceprive.msa.fr/lfy/web/msa"

const testUrl = "https://monespaceprive.msa.fr/z84authmsa/wsrest/auth"

const coUrl = "https://monespaceprive.msa.fr/lfy/web/msa/accueil?modalId=2"

const roleUrl = "https://monespaceprive.msa.fr/lfy/web/msa-ain-rhone/accueil?modalId=5"

const exploitant = "https://monespaceprive.msa.fr/lfy/group/espace-exploitants/mon-espace-prive"

const particulier = "https://monespaceprive.msa.fr/lfy/group/espace-particuliers/mon-espace-prive"



module.exports = new BaseKonnector(start)
  log('debug', 'hey')
  async function start(fields) {
    await this.deactivateAutoSuccessfulLogin()
    await authenticate.bind(this)(fields.login, fields.password)
    log('info', 'set role')
  //  await setRole(fields.role)

}

async function authenticate(username, password) {
  log('debug', 'auth')
  const $ = await request({
    method: 'POST',
    url: testUrl,
    formSelector: "form",
    form: {
      "login": username,
      "password": password
    },
    //followRedirects: false,
    followAllRedirects: true,
    resolveWithFullResponse: true
  })
    .catch(err => {
      log('err', err)
    })
    .then(resp => {
      log('debug',"response:   " + resp.request.uri)
      const cookies = browser.cookies.get("Z84AUTHROUTEID")
      log('debug', cookies)
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

