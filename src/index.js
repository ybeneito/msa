const { BaseKonnector, log, requestFactory, scrape } = require('cozy-konnector-libs')

const CozyBrowser = require('cozy-konnector-libs/dist/libs/CozyBrowser')
const signin = require('cozy-konnector-libs/dist/libs/signin')
const Browser = require("zombie")
const browser = new Browser()

const request = requestFactory({
  cheerio: false,
  json: false,
  jar: true,
  debug: true
})


const baseUrl = "https://monespaceprive.msa.fr/lfy/web/msa"

const testUrl = "https://monespaceprive.msa.fr/z84authmsa/wsrest/auth"

const coUrl = "https://monespaceprive.msa.fr/lfy/web/msa/accueil?modalId=2"

const roleUrl = "https://monespaceprive.msa.fr/lfy/web/msa/accueil?modalId=5"

const exploitant = "https://monespaceprive.msa.fr/lfy/group/espace-exploitants/mon-espace-prive"

const particulier = "https://monespaceprive.msa.fr/lfy/group/espace-particuliers/mon-espace-prive"





module.exports = new BaseKonnector(start)
log('debug', 'hey')
async function start(fields) {
  await this.deactivateAutoSuccessfulLogin()
  await authenticate.bind(this)(fields.login, fields.password)
  log('info', 'set role')
  await setRole(fields.role)

}

async function authenticate(username, password) {
  log('debug', 'auth')
  //browser.assert.attribute('#connexionauthent', 'method', 'post')
  await browser.visit(coUrl, {

    followRedirects: true,
    followAllRedirects: true,
    resolveWithFullResponse: true
  })
    .catch(err => {
      log('err', err)
    })
    .then(resp => {
      //log('debug',"response:   " + resp)
      const cookies = browser.cookies
      log('debug', 'browser:      ' + browser.location)
      log('debug', cookies)
    })
}

async function setRole(role){
  log('debug', role)
  await browser.visit(exploitant)
    .then(resp => {
      const cookies = browser.cookies[0]
      const cookie = cookies.toString().split(' ')[0]
      const id = cookie.split('.')[1]
      const clean = id.split(';')[0]
      log('debug', "test      " + cookies)
      log('debug', 'id:    ' + clean)
      const docsPage = `https://monespaceprive.msa.fr/${clean}/ConsultationGenerique.do`
      docsHome(docsPage)
    })
    .catch(err => {
      log('err', err)
    })


}

async function docsHome(docsPage){
  await browser.visit(docsPage)
    .then(res => {
      const brow = browser
      log('info', 'last      ' + brow)
      log('debug', res)
    })
    .catch(err => {
      log('err', err)
    })
}

