const {
  BaseKonnector,
  log,
  requestFactory,
  scrape,
  signin
} = require('cozy-konnector-libs')

const request = requestFactory({
  debug: true,
  cheerio: true,
  json: false,
  jar: true,
  followAllRedirects: true
})

const coUrl = 'https://monespaceprive.msa.fr/z84authmsa/wsrest/auth'

const roleUrl =
  'https://monespaceprive.msa.fr/lfy/web/msa/accueil?p_p_id=choisirespace_WAR_z80techrwdportlet&p_p_lifecycle=0&p_p_state=exclusive&p_p_mode=view'

module.exports = new BaseKonnector(start)

async function start(fields, cozyParameters) {
  log('info', 'Authentification ... ')
  if (cozyParameters) log('debug', 'Paramètres trouvés')
  await authenticate.bind(this)(fields.login, fields.password)
  log('info', 'Connexion ok')
  log('info', 'set role')
  // await setRole(fields.role)
}

async function authenticate(username, password) {
  log('debug', 'auth')

  const options = {
    method: 'POST',
    url: coUrl,
    formData: {
      _connexionauthent_WAR_z80techrwdportlet__58_login: username,
      _connexionauthent_WAR_z80techrwdportlet__58_password: password
    }
    // 'X-Requested-With': 'XMLHttpRequest'
  }

  try {
    const response = await request(options)
    log('info', 'response' + response)
    const $ = cheerio.load(response)
    const msg = $('.error').text()
    log('debug', 'msg:     ' + msg)
  } catch (err) {
    log('debug', 'err' + err)
  }
}

async function setRole(role) {
  log('debug', role)

  const $ = await request({
    method: 'GET',
    uri: roleUrl
  })
  log('info', $)
}
